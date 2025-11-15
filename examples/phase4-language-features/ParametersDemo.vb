' ========================================
' Phase 4 Demo: Advanced Parameters
' ========================================
' Demonstrates:
' - Optional parameters with defaults
' - ByRef vs ByVal parameter passing
' - ParamArray for variable arguments
' ========================================

Option Explicit

Private Sub Form_Load()
    DemoOptionalParams
    DemoByRefByVal
    DemoParamArray
End Sub

' ========================================
' OPTIONAL PARAMETERS
' ========================================

' Function with optional parameters
Function FormatCurrency(amount As Double, _
                       Optional symbol As String = "$", _
                       Optional decimals As Integer = 2) As String
    FormatCurrency = symbol & Format(amount, "0." & String(decimals, "0"))
End Function

Private Sub DemoOptionalParams()
    Print "Demo 1: Optional Parameters"
    Print String(40, "-")

    ' Call with all defaults
    Print "With defaults: " & FormatCurrency(123.456)

    ' Call with custom symbol
    Print "Custom symbol: " & FormatCurrency(123.456, "€")

    ' Call with all parameters
    Print "All custom: " & FormatCurrency(123.456, "£", 3)

    Print String(40, "-")
End Sub

' ========================================
' BYREF vs BYVAL
' ========================================

' ByRef: Changes affect original variable
Sub IncrementByRef(ByRef value As Integer)
    value = value + 1
    Print "  Inside IncrementByRef: " & value
End Sub

' ByVal: Changes don't affect original
Sub IncrementByVal(ByVal value As Integer)
    value = value + 1
    Print "  Inside IncrementByVal: " & value
End Sub

Private Sub DemoByRefByVal()
    Dim x As Integer
    Dim y As Integer

    Print "Demo 2: ByRef vs ByVal"
    Print String(40, "-")

    ' Test ByRef
    x = 10
    Print "Before ByRef: x = " & x
    IncrementByRef x
    Print "After ByRef: x = " & x
    Print ""

    ' Test ByVal
    y = 10
    Print "Before ByVal: y = " & y
    IncrementByVal y
    Print "After ByVal: y = " & y

    Print String(40, "-")
End Sub

' Swap two values using ByRef
Sub Swap(ByRef a As Variant, ByRef b As Variant)
    Dim temp As Variant
    temp = a
    a = b
    b = temp
End Sub

Private Sub cmdSwap_Click()
    Dim first As Integer, second As Integer

    first = 10
    second = 20

    Print "Before swap: first=" & first & ", second=" & second

    Swap first, second

    Print "After swap: first=" & first & ", second=" & second
End Sub

' ========================================
' PARAMARRAY
' ========================================

' Function that accepts variable number of arguments
Function Sum(ParamArray values() As Variant) As Double
    Dim i As Integer
    Dim total As Double

    total = 0
    For i = LBound(values) To UBound(values)
        If IsNumeric(values(i)) Then
            total = total + values(i)
        End If
    Next i

    Sum = total
End Function

Function Average(ParamArray values() As Variant) As Double
    Dim i As Integer
    Dim total As Double
    Dim count As Integer

    total = 0
    count = 0

    For i = LBound(values) To UBound(values)
        If IsNumeric(values(i)) Then
            total = total + values(i)
            count = count + 1
        End If
    Next i

    If count > 0 Then
        Average = total / count
    Else
        Average = 0
    End If
End Function

Private Sub DemoParamArray()
    Print "Demo 3: ParamArray"
    Print String(40, "-")

    ' Call with different number of arguments
    Print "Sum of 1, 2, 3: " & Sum(1, 2, 3)
    Print "Sum of 10, 20, 30, 40: " & Sum(10, 20, 30, 40)
    Print "Sum of 5, 15: " & Sum(5, 15)

    Print ""
    Print "Average of 10, 20, 30: " & Average(10, 20, 30)
    Print "Average of 1, 2, 3, 4, 5: " & Average(1, 2, 3, 4, 5)

    Print String(40, "-")
End Sub

' More practical example: Join strings
Function JoinStrings(separator As String, ParamArray strings() As Variant) As String
    Dim i As Integer
    Dim result As String

    result = ""
    For i = LBound(strings) To UBound(strings)
        If i > LBound(strings) Then
            result = result & separator
        End If
        result = result & CStr(strings(i))
    Next i

    JoinStrings = result
End Function

Private Sub cmdJoin_Click()
    Dim fullName As String
    Dim path As String

    fullName = JoinStrings(" ", "John", "Q", "Public")
    path = JoinStrings("/", "C:", "Users", "Documents", "file.txt")

    Print "Full name: " & fullName
    Print "Path: " & path
End Sub
