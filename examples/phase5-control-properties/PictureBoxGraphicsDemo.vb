' ========================================
' Phase 5 Demo: PictureBox Graphics Properties
' ========================================
' Demonstrates complete graphics properties:
' - CurrentX, CurrentY
' - DrawMode, DrawStyle, DrawWidth
' - FillColor, FillStyle
' - ScaleMode, ScaleWidth, ScaleHeight
' - AutoRedraw, ClipControls
' ========================================

Option Explicit

Private Sub Form_Load()
    InitializeGraphics
    DemoDrawingModes
End Sub

Private Sub InitializeGraphics()
    ' Setup main picture box
    With picCanvas
        .AutoRedraw = True
        .BackColor = vbWhite
        .ScaleMode = 3  ' vbPixels

        ' Set default drawing properties
        .DrawWidth = 2
        .DrawStyle = 0  ' vbSolid
        .DrawMode = 13  ' vbCopyPen
        .FillStyle = 0  ' vbSolid
        .FillColor = vbBlue
        .ForeColor = vbBlack
    End With

    UpdatePropertiesDisplay
End Sub

' ========================================
' DRAWING MODES
' ========================================

Private Sub DemoDrawingModes()
    Print "PictureBox Graphics Demo"
    Print String(40, "-")
    Print "Available DrawModes:"
    Print "  1 = Blackness"
    Print "  2 = Not Merge Pen"
    Print "  6 = Invert"
    Print "  7 = XOR Pen"
    Print "  11 = No Op"
    Print "  13 = Copy Pen (default)"
    Print "  15 = Whiteness"
    Print String(40, "-")
End Sub

' ========================================
' DRAW STYLE SELECTOR
' ========================================

Private Sub optSolid_Click()
    picCanvas.DrawStyle = 0  ' vbSolid
    UpdatePropertiesDisplay
End Sub

Private Sub optDash_Click()
    picCanvas.DrawStyle = 1  ' vbDash
    UpdatePropertiesDisplay
End Sub

Private Sub optDot_Click()
    picCanvas.DrawStyle = 2  ' vbDot
    UpdatePropertiesDisplay
End Sub

Private Sub optDashDot_Click()
    picCanvas.DrawStyle = 3  ' vbDashDot
    UpdatePropertiesDisplay
End Sub

Private Sub optDashDotDot_Click()
    picCanvas.DrawStyle = 4  ' vbDashDotDot
    UpdatePropertiesDisplay
End Sub

' ========================================
' DRAW WIDTH
' ========================================

Private Sub hsbDrawWidth_Change()
    picCanvas.DrawWidth = hsbDrawWidth.Value
    lblDrawWidth.Caption = "Width: " & hsbDrawWidth.Value
    UpdatePropertiesDisplay
End Sub

' ========================================
' FILL STYLE
' ========================================

Private Sub cboFillStyle_Click()
    picCanvas.FillStyle = cboFillStyle.ListIndex
    UpdatePropertiesDisplay
End Sub

Private Sub LoadFillStyles()
    With cboFillStyle
        .Clear
        .AddItem "0 - Solid"
        .AddItem "1 - Transparent"
        .AddItem "2 - Horizontal Line"
        .AddItem "3 - Vertical Line"
        .AddItem "4 - Upward Diagonal"
        .AddItem "5 - Downward Diagonal"
        .AddItem "6 - Cross"
        .AddItem "7 - Diagonal Cross"
        .ListIndex = 0
    End With
End Sub

' ========================================
' COLORS
' ========================================

Private Sub cmdForeColor_Click()
    Dim colorDialog As Long

    ' Simple color picker (in real VB6, use CommonDialog)
    colorDialog = InputBox("Enter color code (hex):", "Fore Color", Hex$(picCanvas.ForeColor))
    If colorDialog <> "" Then
        picCanvas.ForeColor = CLng("&H" & colorDialog)
        UpdatePropertiesDisplay
    End If
End Sub

Private Sub cmdFillColor_Click()
    Dim colorDialog As Long

    colorDialog = InputBox("Enter color code (hex):", "Fill Color", Hex$(picCanvas.FillColor))
    If colorDialog <> "" Then
        picCanvas.FillColor = CLng("&H" & colorDialog)
        UpdatePropertiesDisplay
    End If
End Sub

' Quick color buttons
Private Sub cmdRed_Click()
    picCanvas.FillColor = vbRed
    UpdatePropertiesDisplay
End Sub

Private Sub cmdGreen_Click()
    picCanvas.FillColor = vbGreen
    UpdatePropertiesDisplay
End Sub

Private Sub cmdBlue_Click()
    picCanvas.FillColor = vbBlue
    UpdatePropertiesDisplay
End Sub

' ========================================
' CURRENT POSITION
' ========================================

Private Sub UpdatePropertiesDisplay()
    lblProperties.Caption = _
        "CurrentX: " & picCanvas.CurrentX & _
        "  CurrentY: " & picCanvas.CurrentY & vbCrLf & _
        "DrawWidth: " & picCanvas.DrawWidth & _
        "  FillStyle: " & picCanvas.FillStyle & vbCrLf & _
        "ForeColor: " & Hex$(picCanvas.ForeColor) & _
        "  FillColor: " & Hex$(picCanvas.FillColor)
End Sub

Private Sub picCanvas_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
    lblMousePos.Caption = "Mouse: " & Int(X) & ", " & Int(Y)
End Sub

' ========================================
' DRAWING OPERATIONS
' ========================================

Private Sub cmdDrawLine_Click()
    With picCanvas
        .Line (.CurrentX, .CurrentY)-(Rnd * .ScaleWidth, Rnd * .ScaleHeight)
        UpdatePropertiesDisplay
    End With
End Sub

Private Sub cmdDrawRect_Click()
    Dim x1 As Single, y1 As Single
    Dim x2 As Single, y2 As Single

    With picCanvas
        x1 = Rnd * .ScaleWidth * 0.5
        y1 = Rnd * .ScaleHeight * 0.5
        x2 = x1 + Rnd * .ScaleWidth * 0.3
        y2 = y1 + Rnd * .ScaleHeight * 0.3

        .Line (x1, y1)-(x2, y2), , B  ' B = Box
        UpdatePropertiesDisplay
    End With
End Sub

Private Sub cmdDrawFilledRect_Click()
    Dim x1 As Single, y1 As Single
    Dim x2 As Single, y2 As Single

    With picCanvas
        x1 = Rnd * .ScaleWidth * 0.5
        y1 = Rnd * .ScaleHeight * 0.5
        x2 = x1 + Rnd * .ScaleWidth * 0.3
        y2 = y1 + Rnd * .ScaleHeight * 0.3

        .Line (x1, y1)-(x2, y2), , BF  ' BF = Filled Box
        UpdatePropertiesDisplay
    End With
End Sub

Private Sub cmdDrawCircle_Click()
    Dim x As Single, y As Single, radius As Single

    With picCanvas
        x = Rnd * .ScaleWidth
        y = Rnd * .ScaleHeight
        radius = Rnd * 100 + 20

        .Circle (x, y), radius
        UpdatePropertiesDisplay
    End With
End Sub

Private Sub cmdDrawEllipse_Click()
    Dim x As Single, y As Single, radius As Single, aspect As Single

    With picCanvas
        x = Rnd * .ScaleWidth
        y = Rnd * .ScaleHeight
        radius = Rnd * 100 + 20
        aspect = Rnd * 2 + 0.5

        .Circle (x, y), radius, , , , aspect
        UpdatePropertiesDisplay
    End With
End Sub

' ========================================
' SCALE MODE
' ========================================

Private Sub cboScaleMode_Click()
    Dim oldScaleMode As Integer

    oldScaleMode = picCanvas.ScaleMode
    picCanvas.ScaleMode = cboScaleMode.ListIndex

    Print "Changed ScaleMode from " & oldScaleMode & " to " & picCanvas.ScaleMode

    lblScale.Caption = "Scale: " & picCanvas.ScaleWidth & " x " & picCanvas.ScaleHeight
End Sub

Private Sub LoadScaleModes()
    With cboScaleMode
        .Clear
        .AddItem "0 - User-defined"
        .AddItem "1 - Twips (default)"
        .AddItem "2 - Points"
        .AddItem "3 - Pixels"
        .AddItem "4 - Characters"
        .AddItem "5 - Inches"
        .AddItem "6 - Millimeters"
        .AddItem "7 - Centimeters"
        .ListIndex = 3  ' Pixels
    End With
End Sub

' ========================================
' PATTERNS AND EFFECTS
' ========================================

Private Sub cmdDrawPattern_Click()
    Dim i As Integer
    Dim x As Single, y As Single

    picCanvas.Cls

    ' Draw grid pattern
    With picCanvas
        For i = 0 To 10
            x = i * (.ScaleWidth / 10)
            y = i * (.ScaleHeight / 10)

            ' Vertical lines
            .Line (x, 0)-(x, .ScaleHeight), vbBlue

            ' Horizontal lines
            .Line (0, y)-(.ScaleWidth, y), vbBlue
        Next i

        UpdatePropertiesDisplay
    End With
End Sub

Private Sub cmdDrawGradient_Click()
    Dim i As Integer
    Dim colorValue As Long

    With picCanvas
        For i = 0 To .ScaleHeight
            colorValue = RGB(0, 0, Int(255 * (i / .ScaleHeight)))
            .Line (0, i)-(.ScaleWidth, i), colorValue
        Next i

        UpdatePropertiesDisplay
    End With
End Sub

' ========================================
' AUTO REDRAW DEMO
' ========================================

Private Sub chkAutoRedraw_Click()
    picCanvas.AutoRedraw = (chkAutoRedraw.Value = 1)

    If picCanvas.AutoRedraw Then
        Print "AutoRedraw ON: Drawing will persist"
    Else
        Print "AutoRedraw OFF: Drawing may disappear on refresh"
    End If
End Sub

Private Sub cmdTestRefresh_Click()
    ' Test AutoRedraw by refreshing
    picCanvas.Refresh

    If picCanvas.AutoRedraw Then
        Print "Refreshed - drawing persisted (AutoRedraw ON)"
    Else
        Print "Refreshed - drawing may be lost (AutoRedraw OFF)"
    End If
End Sub

' ========================================
' CLEAR AND SAVE
' ========================================

Private Sub cmdClear_Click()
    picCanvas.Cls
    picCanvas.CurrentX = 0
    picCanvas.CurrentY = 0
    UpdatePropertiesDisplay
    Print "Canvas cleared"
End Sub

Private Sub cmdSaveImage_Click()
    ' In real VB6, would use SavePicture
    MsgBox "In real VB6:" & vbCrLf & vbCrLf & _
           "SavePicture picCanvas.Image, ""C:\image.bmp""", _
           vbInformation, "Save Image"
End Sub

' ========================================
' PRESET AND POINT
' ========================================

Private Sub cmdRandomPixels_Click()
    Dim i As Integer
    Dim x As Single, y As Single
    Dim c As Long

    With picCanvas
        For i = 1 To 1000
            x = Rnd * .ScaleWidth
            y = Rnd * .ScaleHeight
            c = RGB(Rnd * 255, Rnd * 255, Rnd * 255)

            .PSet (x, y), c
        Next i

        UpdatePropertiesDisplay
    End With
End Sub

Private Sub picCanvas_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
    If Button = 1 Then  ' Left button
        ' Start drawing from this point
        picCanvas.CurrentX = X
        picCanvas.CurrentY = Y
        UpdatePropertiesDisplay
    ElseIf Button = 2 Then  ' Right button
        ' Get pixel color at this point
        Dim pixelColor As Long
        pixelColor = picCanvas.Point(X, Y)
        MsgBox "Pixel color at (" & Int(X) & ", " & Int(Y) & "):" & vbCrLf & _
               "RGB: " & Hex$(pixelColor), vbInformation
    End If
End Sub
