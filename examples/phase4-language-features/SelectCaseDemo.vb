' ========================================
' Phase 4 Demo: Select Case Statement
' ========================================
' Demonstrates all Select Case variations:
' - Case Is (comparisons)
' - Case To (ranges)
' - Case with multiple values
' - Case Else
' ========================================

Option Explicit

Private Sub Form_Load()
    DemoSelectCaseComparison
    DemoSelectCaseRange
    DemoSelectCaseMultiple
    DemoSelectCaseMixed
End Sub

' Demo 1: Select Case with Is comparisons
Private Sub DemoSelectCaseComparison()
    Dim score As Integer
    Dim grade As String

    score = 85

    Select Case score
        Case Is >= 90
            grade = "A - Excellent!"
        Case Is >= 80
            grade = "B - Good!"
        Case Is >= 70
            grade = "C - Average"
        Case Is >= 60
            grade = "D - Below Average"
        Case Else
            grade = "F - Failed"
    End Select

    Print "Score: " & score
    Print "Grade: " & grade
    Print String(40, "-")
End Sub

' Demo 2: Select Case with ranges (To)
Private Sub DemoSelectCaseRange()
    Dim temperature As Integer
    Dim description As String

    temperature = 75

    Select Case temperature
        Case 90 To 120
            description = "Extremely Hot"
        Case 75 To 89
            description = "Hot"
        Case 60 To 74
            description = "Comfortable"
        Case 40 To 59
            description = "Cool"
        Case 20 To 39
            description = "Cold"
        Case Else
            description = "Extremely Cold"
    End Select

    Print "Temperature: " & temperature & "°F"
    Print "Description: " & description
    Print String(40, "-")
End Sub

' Demo 3: Select Case with multiple values
Private Sub DemoSelectCaseMultiple()
    Dim dayNum As Integer
    Dim dayType As String

    dayNum = 3

    Select Case dayNum
        Case 1, 7
            dayType = "Weekend"
        Case 2, 3, 4, 5, 6
            dayType = "Weekday"
        Case Else
            dayType = "Invalid Day"
    End Select

    Print "Day Number: " & dayNum
    Print "Day Type: " & dayType
    Print String(40, "-")
End Sub

' Demo 4: Select Case with mixed conditions
Private Sub DemoSelectCaseMixed()
    Dim value As Integer
    Dim category As String

    value = 15

    Select Case value
        Case 0
            category = "Zero"
        Case 1, 2, 3
            category = "Small (1-3)"
        Case 4 To 10
            category = "Medium (4-10)"
        Case Is > 50
            category = "Very Large (>50)"
        Case Else
            category = "Large (11-50)"
    End Select

    Print "Value: " & value
    Print "Category: " & category
    Print String(40, "-")
End Sub
