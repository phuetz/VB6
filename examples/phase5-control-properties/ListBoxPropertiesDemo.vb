' ========================================
' Phase 5 Demo: ListBox Properties
' ========================================
' Demonstrates complete ListBox properties:
' - List, ListIndex, ListCount
' - ItemData, NewIndex
' - MultiSelect, Selected
' - TopIndex, Sorted
' ========================================

Option Explicit

Private Sub Form_Load()
    InitializeListBoxes
    LoadSampleData
End Sub

Private Sub InitializeListBoxes()
    ' Single select list
    With lstSingle
        .MultiSelect = 0  ' vbMultiSelectNone
        .Sorted = False
    End With

    ' Multi-select list
    With lstMulti
        .MultiSelect = 2  ' vbMultiSelectExtended
        .Sorted = True
    End With

    ' Sorted list
    With lstSorted
        .Sorted = True
    End With
End Sub

Private Sub LoadSampleData()
    Dim i As Integer

    ' Load single select list
    lstSingle.Clear
    lstSingle.AddItem "Apple"
    lstSingle.AddItem "Banana"
    lstSingle.AddItem "Cherry"
    lstSingle.AddItem "Date"
    lstSingle.AddItem "Elderberry"
    lstSingle.AddItem "Fig"
    lstSingle.AddItem "Grape"

    ' Associate ItemData with each item
    For i = 0 To lstSingle.ListCount - 1
        lstSingle.ItemData(i) = (i + 1) * 100
    Next i

    ' Load multi-select list
    lstMulti.Clear
    For i = 1 To 20
        lstMulti.AddItem "Item " & i
    Next i

    UpdateStatus
End Sub

' ========================================
' LIST PROPERTIES
' ========================================

Private Sub UpdateStatus()
    ' Show list properties
    With lstSingle
        lblStatus.Caption = "Count: " & .ListCount & _
                           "  |  Selected: " & .ListIndex & _
                           "  |  TopIndex: " & .TopIndex
    End With
End Sub

Private Sub lstSingle_Click()
    UpdateStatus

    With lstSingle
        If .ListIndex >= 0 Then
            ' Show selected item details
            Print "Selected Item:"
            Print "  Index: " & .ListIndex
            Print "  Text: " & .List(.ListIndex)
            Print "  ItemData: " & .ItemData(.ListIndex)
            Print String(40, "-")
        End If
    End With
End Sub

' ========================================
' ADD / REMOVE ITEMS
' ========================================

Private Sub cmdAdd_Click()
    Dim newItem As String

    newItem = InputBox("Enter item to add:", "Add Item")
    If newItem <> "" Then
        lstSingle.AddItem newItem

        ' Set ItemData for new item
        lstSingle.ItemData(lstSingle.NewIndex) = lstSingle.ListCount * 100

        Print "Added: " & newItem & " at index " & lstSingle.NewIndex
        UpdateStatus
    End If
End Sub

Private Sub cmdRemove_Click()
    With lstSingle
        If .ListIndex >= 0 Then
            Dim removedItem As String
            removedItem = .List(.ListIndex)

            .RemoveItem .ListIndex

            Print "Removed: " & removedItem
            UpdateStatus
        Else
            MsgBox "Please select an item to remove!", vbExclamation
        End If
    End With
End Sub

Private Sub cmdClear_Click()
    If MsgBox("Clear all items?", vbQuestion + vbYesNo) = vbYes Then
        lstSingle.Clear
        Print "List cleared"
        UpdateStatus
    End If
End Sub

' ========================================
' MULTI-SELECT OPERATIONS
' ========================================

Private Sub cmdSelectAll_Click()
    Dim i As Integer

    With lstMulti
        For i = 0 To .ListCount - 1
            .Selected(i) = True
        Next i
    End With

    ShowMultiSelectCount
End Sub

Private Sub cmdSelectNone_Click()
    Dim i As Integer

    With lstMulti
        For i = 0 To .ListCount - 1
            .Selected(i) = False
        Next i
    End With

    ShowMultiSelectCount
End Sub

Private Sub cmdSelectEven_Click()
    Dim i As Integer

    With lstMulti
        For i = 0 To .ListCount - 1
            .Selected(i) = (i Mod 2 = 0)
        Next i
    End With

    ShowMultiSelectCount
End Sub

Private Sub cmdGetSelected_Click()
    Dim i As Integer
    Dim selectedItems As String
    Dim count As Integer

    count = 0
    selectedItems = "Selected items:" & vbCrLf

    With lstMulti
        For i = 0 To .ListCount - 1
            If .Selected(i) Then
                selectedItems = selectedItems & "  - " & .List(i) & vbCrLf
                count = count + 1
            End If
        Next i
    End With

    If count > 0 Then
        MsgBox selectedItems, vbInformation, count & " items selected"
    Else
        MsgBox "No items selected!", vbInformation
    End If
End Sub

Private Sub lstMulti_Click()
    ShowMultiSelectCount
End Sub

Private Sub ShowMultiSelectCount()
    Dim i As Integer
    Dim count As Integer

    count = 0
    With lstMulti
        For i = 0 To .ListCount - 1
            If .Selected(i) Then count = count + 1
        Next i
    End With

    lblMultiCount.Caption = count & " of " & lstMulti.ListCount & " selected"
End Sub

' ========================================
' SORTING
' ========================================

Private Sub chkSorted_Click()
    lstSingle.Sorted = (chkSorted.Value = 1)

    If lstSingle.Sorted Then
        Print "List is now sorted alphabetically"
    Else
        Print "List sorting disabled"
    End If
End Sub

' ========================================
' SCROLLING
' ========================================

Private Sub cmdScrollTop_Click()
    lstMulti.TopIndex = 0
    Print "Scrolled to top"
End Sub

Private Sub cmdScrollBottom_Click()
    With lstMulti
        If .ListCount > 0 Then
            .TopIndex = .ListCount - 1
            Print "Scrolled to bottom"
        End If
    End With
End Sub

Private Sub cmdScrollToIndex_Click()
    Dim index As Integer

    index = Val(InputBox("Enter index to scroll to:", "Scroll", "0"))

    With lstMulti
        If index >= 0 And index < .ListCount Then
            .TopIndex = index
            Print "Scrolled to index " & index
        Else
            MsgBox "Invalid index! Must be 0-" & (.ListCount - 1), vbExclamation
        End If
    End With
End Sub

' ========================================
' FIND AND SELECT
' ========================================

Private Sub cmdFindItem_Click()
    Dim searchText As String
    Dim i As Integer
    Dim found As Boolean

    searchText = InputBox("Enter text to find:", "Find Item")
    If searchText = "" Then Exit Sub

    found = False
    With lstSingle
        For i = 0 To .ListCount - 1
            If InStr(1, .List(i), searchText, vbTextCompare) > 0 Then
                .ListIndex = i
                .TopIndex = i
                found = True
                Exit For
            End If
        Next i
    End With

    If found Then
        Print "Found: " & lstSingle.List(lstSingle.ListIndex)
    Else
        MsgBox "Item not found!", vbInformation
    End If
End Sub

' ========================================
' ITEM DATA OPERATIONS
' ========================================

Private Sub cmdShowAllItemData_Click()
    Dim i As Integer
    Dim report As String

    report = "Item Data Report:" & vbCrLf & String(40, "-") & vbCrLf

    With lstSingle
        For i = 0 To .ListCount - 1
            report = report & Format$(i, "00") & ". " & _
                     .List(i) & " = " & .ItemData(i) & vbCrLf
        Next i
    End With

    MsgBox report, vbInformation, "ItemData"
End Sub

Private Sub cmdSortByItemData_Click()
    ' Manual sort by ItemData
    Dim i As Integer, j As Integer
    Dim tempText As String
    Dim tempData As Long

    With lstSingle
        .Sorted = False  ' Disable auto-sort

        ' Bubble sort by ItemData
        For i = 0 To .ListCount - 2
            For j = i + 1 To .ListCount - 1
                If .ItemData(i) > .ItemData(j) Then
                    ' Swap items
                    tempText = .List(i)
                    tempData = .ItemData(i)

                    .List(i) = .List(j)
                    .ItemData(i) = .ItemData(j)

                    .List(j) = tempText
                    .ItemData(j) = tempData
                End If
            Next j
        Next i
    End With

    Print "Sorted by ItemData"
End Sub

' ========================================
' BULK OPERATIONS
' ========================================

Private Sub cmdLoadBulk_Click()
    Dim i As Integer
    Dim startTime As Single

    startTime = Timer

    lstMulti.Clear
    For i = 1 To 1000
        lstMulti.AddItem "Bulk Item " & i
    Next i

    Print "Loaded 1000 items in " & Format$(Timer - startTime, "0.000") & " seconds"
End Sub

Private Sub cmdRemoveSelected_Click()
    Dim i As Integer
    Dim removedCount As Integer

    removedCount = 0

    With lstMulti
        ' Remove from end to beginning to avoid index shifting
        For i = .ListCount - 1 To 0 Step -1
            If .Selected(i) Then
                .RemoveItem i
                removedCount = removedCount + 1
            End If
        Next i
    End With

    Print "Removed " & removedCount & " items"
    ShowMultiSelectCount
End Sub
