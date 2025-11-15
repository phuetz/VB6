' ========================================
' Phase 4 Demo: ReDim with Preserve
' ========================================
' Demonstrates dynamic array resizing:
' - ReDim to initialize arrays
' - ReDim Preserve to resize without losing data
' - Multi-dimensional arrays
' ========================================

Option Explicit

Private Sub Form_Load()
    DemoBasicReDim
    DemoReDimPreserve
    DemoMultiDimensional
End Sub

' Demo 1: Basic ReDim
Private Sub DemoBasicReDim()
    Dim numbers() As Integer
    Dim i As Integer

    Print "Demo 1: Basic ReDim"
    Print String(40, "-")

    ' Initialize array with 5 elements
    ReDim numbers(4)  ' 0 to 4 = 5 elements

    For i = 0 To 4
        numbers(i) = i * 10
    Next i

    Print "Array created with " & (UBound(numbers) + 1) & " elements:"
    For i = 0 To UBound(numbers)
        Print "  numbers(" & i & ") = " & numbers(i)
    Next i

    Print String(40, "-")
End Sub

' Demo 2: ReDim Preserve
Private Sub DemoReDimPreserve()
    Dim data() As String
    Dim i As Integer

    Print "Demo 2: ReDim Preserve"
    Print String(40, "-")

    ' Start with 3 elements
    ReDim data(2)
    data(0) = "First"
    data(1) = "Second"
    data(2) = "Third"

    Print "Initial array (3 elements):"
    For i = 0 To UBound(data)
        Print "  " & data(i)
    Next i

    ' Expand to 6 elements while preserving data
    ReDim Preserve data(5)
    data(3) = "Fourth"
    data(4) = "Fifth"
    data(5) = "Sixth"

    Print ""
    Print "After ReDim Preserve (6 elements):"
    For i = 0 To UBound(data)
        Print "  " & data(i)
    Next i

    Print String(40, "-")
End Sub

' Demo 3: Multi-dimensional arrays
Private Sub DemoMultiDimensional()
    Dim matrix() As Integer
    Dim i As Integer, j As Integer

    Print "Demo 3: Multi-dimensional ReDim"
    Print String(40, "-")

    ' Create a 3x3 matrix
    ReDim matrix(2, 2)

    ' Fill the matrix
    For i = 0 To 2
        For j = 0 To 2
            matrix(i, j) = (i + 1) * (j + 1)
        Next j
    Next i

    ' Display the matrix
    Print "3x3 Multiplication Matrix:"
    For i = 0 To 2
        Dim row As String
        row = "  "
        For j = 0 To 2
            row = row & Format(matrix(i, j), "000") & " "
        Next j
        Print row
    Next i

    Print String(40, "-")
End Sub

' Demo 4: Dynamic growth
Private Sub cmdAddItem_Click()
    Static items() As String
    Static count As Integer
    Dim newItem As String

    newItem = InputBox("Enter item to add:", "Add Item")
    If Len(newItem) = 0 Then Exit Sub

    ' Grow array by 1
    If count = 0 Then
        ReDim items(0)
    Else
        ReDim Preserve items(count)
    End If

    items(count) = newItem
    count = count + 1

    ' Display all items
    Cls
    Print "Items in array (" & count & "):"
    Dim i As Integer
    For i = 0 To count - 1
        Print "  " & (i + 1) & ". " & items(i)
    Next i
End Sub
