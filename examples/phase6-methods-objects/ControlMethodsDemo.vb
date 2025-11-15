' ========================================
' Phase 6 Demo: Control Methods
' ========================================
' Demonstrates all control methods:
' - Form methods (Show, Hide, Refresh, etc.)
' - List methods (AddItem, RemoveItem, Clear)
' - Graphics methods (Line, Circle, PSet, etc.)
' - DoEvents for responsiveness
' ========================================

Option Explicit

Private Sub Form_Load()
    InitializeForm
    LoadListData
End Sub

Private Sub InitializeForm()
    Me.Caption = "Control Methods Demo"

    ' Initialize list
    With lstDemo
        .Clear
    End With

    ' Initialize picture box
    With picDemo
        .AutoRedraw = True
        .BackColor = vbWhite
        .ScaleMode = 3  ' Pixels
    End With
End Sub

' ========================================
' FORM METHODS
' ========================================

Private Sub cmdShowForm_Click()
    Dim frm As New Form2

    ' Show form mode less (non-blocking)
    frm.Show 0  ' vbModeless

    Print "Form2 shown (modeless)"
End Sub

Private Sub cmdShowModalForm_Click()
    Dim frm As New Form2

    Print "Showing Form2 (modal) - blocks until closed"

    ' Show form modal (blocking)
    frm.Show 1  ' vbModal

    Print "Form2 closed, continuing..."
End Sub

Private Sub cmdHideForm_Click()
    ' Hide this form
    Me.Hide

    ' Note: In real app, would need another way to show it again
    MsgBox "Form hidden! Showing again...", vbInformation
    Me.Show
End Sub

Private Sub cmdRefreshForm_Click()
    ' Force form to redraw
    Me.Refresh

    Print "Form refreshed"
End Sub

Private Sub cmdUnloadForm_Click()
    If MsgBox("Unload this form (will close the demo)?", vbQuestion + vbYesNo) = vbYes Then
        Unload Me
    End If
End Sub

Private Sub cmdSetFocus_Click()
    ' Set focus to text box
    txtDemo.SetFocus

    Print "Focus set to txtDemo"
End Sub

Private Sub cmdMove_Click()
    ' Move and resize form
    Me.Move 1000, 1000, 8000, 6000

    Print "Form moved and resized"
End Sub

Private Sub cmdCls_Click()
    ' Clear form
    Cls

    Print "Form cleared (Cls method)"
End Sub

' ========================================
' LIST CONTROL METHODS
' ========================================

Private Sub LoadListData()
    lstDemo.Clear

    lstDemo.AddItem "Apple"
    lstDemo.AddItem "Banana"
    lstDemo.AddItem "Cherry"
    lstDemo.AddItem "Date"
    lstDemo.AddItem "Elderberry"

    UpdateListStatus
End Sub

Private Sub cmdAddItem_Click()
    Dim newItem As String

    newItem = InputBox("Enter item to add:", "Add Item")
    If newItem <> "" Then
        ' Add item at end
        lstDemo.AddItem newItem

        Print "Added: " & newItem & " at index " & lstDemo.NewIndex

        UpdateListStatus
    End If
End Sub

Private Sub cmdAddItemAt_Click()
    Dim newItem As String
    Dim index As Integer

    newItem = InputBox("Enter item to add:", "Add Item")
    If newItem = "" Then Exit Sub

    index = Val(InputBox("Enter index (0-" & lstDemo.ListCount & "):", "Index", "0"))

    ' Add item at specific index
    lstDemo.AddItem newItem, index

    Print "Added: " & newItem & " at index " & index

    UpdateListStatus
End Sub

Private Sub cmdRemoveItem_Click()
    With lstDemo
        If .ListIndex >= 0 Then
            Dim removedItem As String
            removedItem = .List(.ListIndex)

            ' Remove selected item
            .RemoveItem .ListIndex

            Print "Removed: " & removedItem

            UpdateListStatus
        Else
            MsgBox "Please select an item first!", vbExclamation
        End If
    End With
End Sub

Private Sub cmdClearList_Click()
    ' Clear all items
    lstDemo.Clear

    Print "List cleared"

    UpdateListStatus
End Sub

Private Sub cmdSort_Click()
    ' Toggle sorting
    lstDemo.Sorted = Not lstDemo.Sorted

    If lstDemo.Sorted Then
        Print "List sorting enabled"
    Else
        Print "List sorting disabled"
    End If
End Sub

Private Sub UpdateListStatus()
    lblListStatus.Caption = "Items: " & lstDemo.ListCount & _
                           "  |  Selected: " & lstDemo.ListIndex
End Sub

Private Sub lstDemo_Click()
    UpdateListStatus
End Sub

' ========================================
' GRAPHICS METHODS
' ========================================

Private Sub cmdDrawLine_Click()
    With picDemo
        ' Draw line from current position to random point
        .Line (.CurrentX, .CurrentY)-(Rnd * .ScaleWidth, Rnd * .ScaleHeight), vbBlue
    End With

    Print "Line drawn"
End Sub

Private Sub cmdDrawRect_Click()
    Dim x1 As Single, y1 As Single
    Dim x2 As Single, y2 As Single

    With picDemo
        x1 = Rnd * .ScaleWidth * 0.5
        y1 = Rnd * .ScaleHeight * 0.5
        x2 = x1 + Rnd * .ScaleWidth * 0.3
        y2 = y1 + Rnd * .ScaleHeight * 0.3

        ' Draw rectangle (B = Box)
        .Line (x1, y1)-(x2, y2), vbRed, B
    End With

    Print "Rectangle drawn"
End Sub

Private Sub cmdDrawFilledRect_Click()
    Dim x1 As Single, y1 As Single
    Dim x2 As Single, y2 As Single

    With picDemo
        x1 = Rnd * .ScaleWidth * 0.5
        y1 = Rnd * .ScaleHeight * 0.5
        x2 = x1 + Rnd * .ScaleWidth * 0.3
        y2 = y1 + Rnd * .ScaleHeight * 0.3

        ' Draw filled rectangle (BF = Box Filled)
        .Line (x1, y1)-(x2, y2), RGB(Rnd * 255, Rnd * 255, Rnd * 255), BF
    End With

    Print "Filled rectangle drawn"
End Sub

Private Sub cmdDrawCircle_Click()
    Dim x As Single, y As Single, radius As Single

    With picDemo
        x = Rnd * .ScaleWidth
        y = Rnd * .ScaleHeight
        radius = Rnd * 80 + 20

        ' Draw circle
        .Circle (x, y), radius, vbGreen
    End With

    Print "Circle drawn"
End Sub

Private Sub cmdDrawFilledCircle_Click()
    Dim x As Single, y As Single, radius As Single

    With picDemo
        x = Rnd * .ScaleWidth
        y = Rnd * .ScaleHeight
        radius = Rnd * 80 + 20

        .FillStyle = 0  ' Solid
        .FillColor = RGB(Rnd * 255, Rnd * 255, Rnd * 255)

        ' Draw filled circle
        .Circle (x, y), radius
    End With

    Print "Filled circle drawn"
End Sub

Private Sub cmdPSet_Click()
    Dim i As Integer
    Dim x As Single, y As Single

    With picDemo
        ' Draw random pixels
        For i = 1 To 500
            x = Rnd * .ScaleWidth
            y = Rnd * .ScaleHeight

            .PSet (x, y), RGB(Rnd * 255, Rnd * 255, Rnd * 255)
        Next i
    End With

    Print "500 random pixels drawn (PSet)"
End Sub

Private Sub cmdPoint_Click()
    Dim x As Single, y As Single
    Dim pixelColor As Long

    With picDemo
        x = Rnd * .ScaleWidth
        y = Rnd * .ScaleHeight

        ' Get pixel color
        pixelColor = .Point(x, y)

        MsgBox "Pixel at (" & Int(x) & ", " & Int(y) & ")" & vbCrLf & _
               "Color: " & Hex$(pixelColor), vbInformation, "Point Method"
    End With
End Sub

Private Sub cmdPrint_Click()
    With picDemo
        .CurrentX = 10
        .CurrentY = 10
        .FontSize = 12
        .FontBold = True

        ' Print text on picture box
        .Print "Hello from VB6!"

        .FontBold = False
        .Print "Graphics methods working!"
    End With

    Print "Text printed on picture box"
End Sub

Private Sub cmdClearPicture_Click()
    ' Clear picture box
    picDemo.Cls

    picDemo.CurrentX = 0
    picDemo.CurrentY = 0

    Print "Picture box cleared (Cls)"
End Sub

Private Sub cmdLoadPicture_Click()
    ' In real VB6, would use LoadPicture function
    MsgBox "In real VB6:" & vbCrLf & vbCrLf & _
           "Set picDemo.Picture = LoadPicture(""C:\image.bmp"")", _
           vbInformation, "LoadPicture Method"

    Print "LoadPicture method (see message box)"
End Sub

' ========================================
' DOEVENTS METHOD
' ========================================

Private Sub cmdDoEvents_Click()
    Dim i As Long
    Dim startTime As Single

    Print "Starting long operation..."
    Print "Notice the form remains responsive!"
    Print String(50, "-")

    startTime = Timer

    For i = 1 To 100000
        ' Simulate work
        Dim temp As Double
        temp = Sqr(i) * Log(i + 1)

        ' Update UI every 1000 iterations
        If i Mod 1000 = 0 Then
            lblProgress.Caption = "Processing: " & i & " / 100000"

            ' DoEvents allows form to process messages
            DoEvents
        End If
    Next i

    lblProgress.Caption = "Complete!"

    Print "Operation completed in " & Format$(Timer - startTime, "0.00") & " seconds"
    Print "DoEvents kept the UI responsive!"
End Sub

Private Sub cmdWithoutDoEvents_Click()
    Dim i As Long
    Dim startTime As Single

    Print "Starting long operation WITHOUT DoEvents..."
    Print "Notice the form may freeze!"
    Print String(50, "-")

    startTime = Timer

    For i = 1 To 100000
        ' Simulate work
        Dim temp As Double
        temp = Sqr(i) * Log(i + 1)

        ' Update UI but no DoEvents
        If i Mod 1000 = 0 Then
            lblProgress.Caption = "Processing: " & i & " / 100000"
            ' No DoEvents here!
        End If
    Next i

    lblProgress.Caption = "Complete!"

    Print "Operation completed in " & Format$(Timer - startTime, "0.00") & " seconds"
    Print "Without DoEvents, UI was frozen!"
End Sub

' ========================================
' COMPOSITE DEMO
' ========================================

Private Sub cmdCompleteDemo_Click()
    Dim i As Integer

    Cls
    Print "Running complete methods demo..."
    Print String(50, "=")
    Print ""

    ' Form methods
    Print "FORM METHODS:"
    Me.Refresh
    Print "  ✓ Refresh"

    ' List methods
    Print ""
    Print "LIST METHODS:"
    lstDemo.Clear
    Print "  ✓ Clear"

    For i = 1 To 5
        lstDemo.AddItem "Demo Item " & i
        DoEvents
    Next i
    Print "  ✓ AddItem (" & lstDemo.ListCount & " items)"

    ' Graphics methods
    Print ""
    Print "GRAPHICS METHODS:"
    picDemo.Cls
    Print "  ✓ Cls"

    picDemo.Line (10, 10)-(100, 100), vbBlue
    Print "  ✓ Line"

    picDemo.Circle (150, 50), 40, vbRed
    Print "  ✓ Circle"

    picDemo.PSet (200, 50), vbGreen
    Print "  ✓ PSet"

    picDemo.Print "VB6"
    Print "  ✓ Print"

    Print ""
    Print "Demo complete!"
    Print String(50, "=")
End Sub
