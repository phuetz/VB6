' ========================================
' COMPLETE VB6 APPLICATION EXAMPLE
' Task Manager with Full Feature Set
' ========================================
' This application demonstrates:
' - Phase 4: Select Case, ReDim Preserve, Optional params, ByRef/ByVal
' - Phase 5: TextBox selection, ListBox operations, Graphics properties
' - Phase 6: Form methods, Control methods, Global objects
' ========================================

Option Explicit

' ========== MODULE-LEVEL VARIABLES ==========
Private tasks() As String
Private taskStatus() As Integer  ' 0=Pending, 1=In Progress, 2=Complete
Private taskPriority() As Integer  ' 1=Low, 2=Medium, 3=High
Private taskCount As Integer
Private filterMode As Integer  ' 0=All, 1=Pending, 2=Complete

' ========== FORM INITIALIZATION ==========

Private Sub Form_Load()
    ' Set application properties
    App.Title = "VB6 Task Manager"
    Me.Caption = App.Title & " v" & App.Major & "." & App.Minor

    ' Log startup
    Debug.Print "===== APPLICATION STARTED ====="
    Debug.Print "Time: " & Now
    Debug.Print "Screen: " & Screen.Width \ Screen.TwipsPerPixelX & "x" & _
                Screen.Height \ Screen.TwipsPerPixelY
    App.LogEvent "Task Manager started", vbLogEventTypeInformation

    ' Initialize arrays
    taskCount = 0
    ReDim tasks(9)
    ReDim taskStatus(9)
    ReDim taskPriority(9)

    ' Initialize controls
    InitializeControls

    ' Load sample data
    LoadSampleTasks

    ' Update display
    RefreshTaskList
    UpdateStatistics
    DrawPriorityChart
End Sub

' ========== CONTROL INITIALIZATION ==========

Private Sub InitializeControls()
    ' Task list
    With lstTasks
        .Clear
        .MultiSelect = 0
    End With

    ' Task description (Phase 5: TextBox properties)
    With txtTaskDescription
        .MaxLength = 500
        .MultiLine = True
        .ScrollBars = 3  ' Both
        .Text = ""
    End With

    ' Priority combo box
    With cboPriority
        .Clear
        .AddItem "1 - Low"
        .AddItem "2 - Medium"
        .AddItem "3 - High"
        .ListIndex = 1  ' Default to Medium
    End With

    ' Status combo box
    With cboStatus
        .Clear
        .AddItem "Pending"
        .AddItem "In Progress"
        .AddItem "Complete"
        .ListIndex = 0
    End With

    ' Filter combo box
    With cboFilter
        .Clear
        .AddItem "All Tasks"
        .AddItem "Pending Only"
        .AddItem "Complete Only"
        .ListIndex = 0
    End With

    ' Chart picture box (Phase 5: Graphics properties)
    With picChart
        .AutoRedraw = True
        .BackColor = vbWhite
        .ScaleMode = 3  ' Pixels
        .DrawWidth = 2
    End With

    Debug.Print "Controls initialized"
End Sub

' ========== SAMPLE DATA ==========

Private Sub LoadSampleTasks()
    ' Phase 4: Using optional parameters and ByRef
    AddTaskInternal "Design database schema", 3, 1  ' High priority, In Progress
    AddTaskInternal "Create user interface mockups", 2, 2  ' Medium, Complete
    AddTaskInternal "Write documentation", 1, 0  ' Low, Pending
    AddTaskInternal "Implement authentication", 3, 0  ' High, Pending
    AddTaskInternal "Set up development environment", 2, 2  ' Medium, Complete

    Debug.Print "Sample tasks loaded: " & taskCount
End Sub

' ========== TASK OPERATIONS ==========

' Phase 4: Optional parameters with defaults
Private Sub AddTaskInternal(description As String, _
                            Optional priority As Integer = 2, _
                            Optional status As Integer = 0)
    ' Phase 4: ReDim Preserve to grow array
    If taskCount >= UBound(tasks) Then
        ReDim Preserve tasks(UBound(tasks) + 10)
        ReDim Preserve taskStatus(UBound(taskStatus) + 10)
        ReDim Preserve taskPriority(UBound(taskPriority) + 10)
    End If

    tasks(taskCount) = description
    taskStatus(taskCount) = status
    taskPriority(taskCount) = priority

    taskCount = taskCount + 1

    Debug.Print "Task added: " & description
End Sub

Private Sub cmdAdd_Click()
    Dim description As String
    Dim priority As Integer
    Dim status As Integer

    ' Get description (Phase 5: TextBox properties)
    description = Trim$(txtTaskDescription.Text)

    ' Validate input
    If Len(description) = 0 Then
        MsgBox "Please enter a task description!", vbExclamation, "Validation Error"
        txtTaskDescription.SetFocus
        Exit Sub
    End If

    ' Get priority and status
    priority = cboPriority.ListIndex + 1
    status = cboStatus.ListIndex

    ' Add task
    AddTaskInternal description, priority, status

    ' Refresh UI
    RefreshTaskList
    UpdateStatistics
    DrawPriorityChart

    ' Clear form
    txtTaskDescription.Text = ""
    cboPriority.ListIndex = 1
    cboStatus.ListIndex = 0
    txtTaskDescription.SetFocus

    ' Log event
    App.LogEvent "Task added: " & description, vbLogEventTypeInformation
End Sub

Private Sub cmdRemove_Click()
    Dim selectedIndex As Integer

    selectedIndex = lstTasks.ListIndex

    If selectedIndex < 0 Then
        MsgBox "Please select a task to remove!", vbExclamation
        Exit Sub
    End If

    If MsgBox("Remove task: " & tasks(selectedIndex) & "?", _
              vbQuestion + vbYesNo, "Confirm") = vbNo Then
        Exit Sub
    End If

    ' Phase 4: Remove by shifting elements (uses ByVal implicitly)
    RemoveTask selectedIndex

    ' Refresh UI
    RefreshTaskList
    UpdateStatistics
    DrawPriorityChart

    App.LogEvent "Task removed", vbLogEventTypeInformation
End Sub

' Phase 4: ByRef to return success status
Private Sub RemoveTask(ByVal index As Integer)
    Dim i As Integer

    ' Shift all elements down
    For i = index To taskCount - 2
        tasks(i) = tasks(i + 1)
        taskStatus(i) = taskStatus(i + 1)
        taskPriority(i) = taskPriority(i + 1)
    Next i

    taskCount = taskCount - 1

    Debug.Print "Task removed at index: " & index
End Sub

Private Sub cmdEdit_Click()
    Dim selectedIndex As Integer

    selectedIndex = lstTasks.ListIndex

    If selectedIndex < 0 Then
        MsgBox "Please select a task to edit!", vbExclamation
        Exit Sub
    End If

    ' Load task into form
    txtTaskDescription.Text = tasks(selectedIndex)
    cboPriority.ListIndex = taskPriority(selectedIndex) - 1
    cboStatus.ListIndex = taskStatus(selectedIndex)

    ' Remove old and add will create new
    RemoveTask selectedIndex
    RefreshTaskList
End Sub

' ========== LIST DISPLAY ==========

Private Sub RefreshTaskList()
    Dim i As Integer
    Dim displayText As String

    ' Phase 6: List control methods
    lstTasks.Clear

    For i = 0 To taskCount - 1
        ' Phase 4: Select Case for filtering
        Select Case filterMode
            Case 0  ' All
                ' Show all
            Case 1  ' Pending only
                If taskStatus(i) <> 0 Then
                    GoTo NextTask
                End If
            Case 2  ' Complete only
                If taskStatus(i) <> 2 Then
                    GoTo NextTask
                End If
        End Select

        ' Format display text
        displayText = FormatTaskDisplay(i)

        ' Phase 6: AddItem method
        lstTasks.AddItem displayText

        ' Phase 5: ItemData to store original index
        lstTasks.ItemData(lstTasks.NewIndex) = i

NextTask:
    Next i

    ' Update count label
    lblTaskCount.Caption = lstTasks.ListCount & " tasks shown"

    ' Phase 6: DoEvents to keep UI responsive
    DoEvents
End Sub

' Phase 4: Optional parameters for formatting
Private Function FormatTaskDisplay(index As Integer, _
                                   Optional showPriority As Boolean = True, _
                                   Optional showStatus As Boolean = True) As String
    Dim result As String
    Dim statusText As String
    Dim priorityText As String

    result = tasks(index)

    If showStatus Then
        ' Phase 4: Select Case for status
        Select Case taskStatus(index)
            Case 0: statusText = "[Pending]"
            Case 1: statusText = "[In Progress]"
            Case 2: statusText = "[Complete]"
            Case Else: statusText = "[Unknown]"
        End Select

        result = statusText & " " & result
    End If

    If showPriority Then
        ' Phase 4: Select Case with ranges
        Select Case taskPriority(index)
            Case 1: priorityText = "(Low)"
            Case 2: priorityText = "(Med)"
            Case 3: priorityText = "(High)"
        End Select

        result = result & " " & priorityText
    End If

    FormatTaskDisplay = result
End Function

Private Sub lstTasks_Click()
    ' Show task details
    Dim selectedIndex As Integer
    Dim realIndex As Integer

    selectedIndex = lstTasks.ListIndex

    If selectedIndex >= 0 Then
        ' Get real task index from ItemData
        realIndex = lstTasks.ItemData(selectedIndex)

        ' Display in text box
        lblSelectedTask.Caption = "Selected: " & tasks(realIndex)
    End If
End Sub

' ========== FILTERING ==========

Private Sub cboFilter_Click()
    filterMode = cboFilter.ListIndex
    RefreshTaskList
    UpdateStatistics
End Sub

' ========== STATISTICS ==========

Private Sub UpdateStatistics()
    Dim i As Integer
    Dim pendingCount As Integer
    Dim inProgressCount As Integer
    Dim completeCount As Integer
    Dim highPriorityCount As Integer

    pendingCount = 0
    inProgressCount = 0
    completeCount = 0
    highPriorityCount = 0

    For i = 0 To taskCount - 1
        ' Phase 4: Select Case for counting
        Select Case taskStatus(i)
            Case 0: pendingCount = pendingCount + 1
            Case 1: inProgressCount = inProgressCount + 1
            Case 2: completeCount = completeCount + 1
        End Select

        If taskPriority(i) = 3 Then
            highPriorityCount = highPriorityCount + 1
        End If
    Next i

    ' Display statistics
    lblStats.Caption = "Total: " & taskCount & _
                      "  |  Pending: " & pendingCount & _
                      "  |  In Progress: " & inProgressCount & _
                      "  |  Complete: " & completeCount & _
                      "  |  High Priority: " & highPriorityCount

    ' Calculate completion percentage
    Dim completionPercent As Single
    If taskCount > 0 Then
        completionPercent = (completeCount / taskCount) * 100
    Else
        completionPercent = 0
    End If

    lblCompletion.Caption = "Completion: " & Format$(completionPercent, "0.0") & "%"
End Sub

' ========== GRAPHICS ==========

Private Sub DrawPriorityChart()
    Dim i As Integer
    Dim lowCount As Integer, medCount As Integer, highCount As Integer
    Dim maxCount As Integer
    Dim barWidth As Single
    Dim barHeight As Single

    ' Count by priority
    lowCount = 0: medCount = 0: highCount = 0

    For i = 0 To taskCount - 1
        Select Case taskPriority(i)
            Case 1: lowCount = lowCount + 1
            Case 2: medCount = medCount + 1
            Case 3: highCount = highCount + 1
        End Select
    Next i

    ' Phase 6: Graphics methods
    With picChart
        .Cls  ' Clear chart

        ' Find max for scaling
        maxCount = lowCount
        If medCount > maxCount Then maxCount = medCount
        If highCount > maxCount Then maxCount = highCount

        If maxCount = 0 Then maxCount = 1  ' Avoid division by zero

        ' Calculate bar dimensions
        barWidth = .ScaleWidth / 4

        ' Phase 5: Graphics properties (FillStyle, DrawWidth)
        .FillStyle = 0  ' Solid
        .DrawWidth = 2

        ' Draw Low priority bar (Green)
        .FillColor = vbGreen
        barHeight = (lowCount / maxCount) * (.ScaleHeight - 40)
        .Line (barWidth * 0.5, .ScaleHeight - barHeight)- _
              (barWidth * 1.5, .ScaleHeight), vbGreen, BF

        ' Draw Medium priority bar (Yellow)
        .FillColor = &HFFFF00  ' Yellow
        barHeight = (medCount / maxCount) * (.ScaleHeight - 40)
        .Line (barWidth * 1.5, .ScaleHeight - barHeight)- _
              (barWidth * 2.5, .ScaleHeight), &HFFFF00, BF

        ' Draw High priority bar (Red)
        .FillColor = vbRed
        barHeight = (highCount / maxCount) * (.ScaleHeight - 40)
        .Line (barWidth * 2.5, .ScaleHeight - barHeight)- _
              (barWidth * 3.5, .ScaleHeight), vbRed, BF

        ' Draw labels (Phase 6: Print method)
        .CurrentX = barWidth * 0.7
        .CurrentY = .ScaleHeight - 20
        .Print "Low:" & lowCount

        .CurrentX = barWidth * 1.7
        .CurrentY = .ScaleHeight - 20
        .Print "Med:" & medCount

        .CurrentX = barWidth * 2.7
        .CurrentY = .ScaleHeight - 20
        .Print "High:" & highCount
    End With

    Debug.Print "Chart updated: Low=" & lowCount & " Med=" & medCount & " High=" & highCount
End Sub

' ========== EXPORT / PRINT ==========

Private Sub cmdExport_Click()
    Dim i As Integer
    Dim exportText As String

    exportText = "TASK MANAGER EXPORT" & vbCrLf
    exportText = exportText & "Generated: " & Now & vbCrLf
    exportText = exportText & String(60, "=") & vbCrLf & vbCrLf

    exportText = exportText & "Application: " & App.Title & vbCrLf
    exportText = exportText & "Version: " & App.Major & "." & App.Minor & vbCrLf & vbCrLf

    exportText = exportText & "TASKS (" & taskCount & ")" & vbCrLf
    exportText = exportText & String(60, "-") & vbCrLf

    For i = 0 To taskCount - 1
        exportText = exportText & Format$(i + 1, "000") & ". "
        exportText = exportText & FormatTaskDisplay(i) & vbCrLf
    Next i

    ' Show export preview
    MsgBox exportText, vbInformation, "Export Preview"

    App.LogEvent "Data exported", vbLogEventTypeInformation
End Sub

Private Sub cmdPrint_Click()
    Dim i As Integer

    ' Phase 6: Printer object
    With Printer
        .Orientation = vbPRORPortrait
        .FontName = "Arial"

        ' Header
        .FontSize = 16
        .FontBold = True
        .Print App.Title
        .Print ""

        .FontSize = 10
        .FontBold = False
        .Print "Generated: " & Now
        .Print String(60, "-")
        .Print ""

        ' Tasks
        .FontSize = 12
        .FontBold = True
        .Print "TASKS (" & taskCount & ")"
        .FontBold = False
        .Print String(60, "-")

        For i = 0 To taskCount - 1
            .Print Format$(i + 1, "00") & ". " & FormatTaskDisplay(i)

            ' New page every 40 tasks
            If (i + 1) Mod 40 = 0 And i < taskCount - 1 Then
                .NewPage
            End If
        Next i

        ' Statistics page
        .NewPage
        .FontSize = 14
        .FontBold = True
        .Print "STATISTICS"
        .Print ""

        .FontSize = 12
        .FontBold = False
        .Print lblStats.Caption
        .Print lblCompletion.Caption

        ' Send to printer
        .EndDoc
    End With

    MsgBox "Document sent to printer!", vbInformation

    App.LogEvent "Tasks printed", vbLogEventTypeInformation
End Sub

' ========== SEARCH ==========

Private Sub txtSearch_Change()
    ' Phase 5: TextBox properties (real-time search)
    Dim searchTerm As String
    Dim i As Integer

    searchTerm = LCase$(txtSearch.Text)

    If Len(searchTerm) = 0 Then
        RefreshTaskList
        Exit Sub
    End If

    ' Filter by search term
    lstTasks.Clear

    For i = 0 To taskCount - 1
        If InStr(1, LCase$(tasks(i)), searchTerm) > 0 Then
            lstTasks.AddItem FormatTaskDisplay(i)
            lstTasks.ItemData(lstTasks.NewIndex) = i
        End If
    Next i

    lblTaskCount.Caption = lstTasks.ListCount & " tasks found"

    ' Phase 6: DoEvents for responsive search
    DoEvents
End Sub

' ========== FORM EVENTS ==========

Private Sub Form_Resize()
    ' Keep UI responsive during resize (Phase 6: DoEvents)
    DoEvents
End Sub

Private Sub Form_Unload(Cancel As Integer)
    Dim response As Integer

    ' Confirm exit
    response = MsgBox("Close Task Manager?", vbQuestion + vbYesNo, "Confirm Exit")

    If response = vbNo Then
        Cancel = 1  ' Cancel the unload
    Else
        ' Log shutdown
        Debug.Print "===== APPLICATION CLOSED ====="
        Debug.Print "Time: " & Now
        App.LogEvent "Task Manager closed", vbLogEventTypeInformation
    End If
End Sub

' ========== ABOUT ==========

Private Sub mnuAbout_Click()
    Dim msg As String

    msg = App.Title & vbCrLf
    msg = msg & "Version " & App.Major & "." & App.Minor & "." & App.Revision & vbCrLf & vbCrLf
    msg = msg & "Complete VB6 Application Example" & vbCrLf & vbCrLf
    msg = msg & "Demonstrates:" & vbCrLf
    msg = msg & "• Phase 4: Language Features" & vbCrLf
    msg = msg & "• Phase 5: Control Properties" & vbCrLf
    msg = msg & "• Phase 6: Methods & Objects" & vbCrLf & vbCrLf
    msg = msg & "Screen: " & Screen.Width \ Screen.TwipsPerPixelX & "x" & _
                Screen.Height \ Screen.TwipsPerPixelY & vbCrLf
    msg = msg & "Path: " & App.Path

    MsgBox msg, vbInformation, "About"
End Sub
