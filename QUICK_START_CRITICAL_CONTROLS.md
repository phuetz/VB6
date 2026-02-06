# Quick Start Guide: Critical VB6 Controls

This guide shows how to use the newly implemented DBList, DBCombo, DataRepeater, MSChart, and PictureClip controls in your VB6 projects within the IDE.

## Getting Started

### 1. Access Controls from Toolbox

When you open the IDE, you'll see new control categories in the Toolbox:

```
Toolbox
├── General (existing controls)
├── ActiveX (existing controls)
├── DataBound (NEW!)
│   ├── DBList
│   ├── DBCombo
│   ├── DataRepeater
│   ├── DataList
│   ├── DataCombo
│   └── DataGrid
├── Charts (NEW!)
│   └── MSChart
├── Graphics (NEW!)
│   └── PictureClip
└── Internet (existing controls)
```

### 2. Add Control to Form

**Method 1: Drag from Toolbox**

1. Open Toolbox
2. Select category (DataBound, Charts, or Graphics)
3. Double-click or drag control to form
4. Control appears with default size

**Method 2: Manual Creation (Code)**

```vb6
Private Sub Form_Load()
    ' This creates control at runtime (in real VB6)
    ' In the IDE, use Toolbox drag-drop instead
End Sub
```

---

## Control-Specific Quick Starts

### DBList Control

**What it does**: Displays items from a database recordset in a list box

**Basic Setup**:

```vb6
Private Sub Form_Load()
    ' Set the data source
    DBList1.RowSource = "Customers"

    ' Set which field to display
    DBList1.ListField = "CompanyName"

    ' Set which column is the value
    DBList1.BoundColumn = 0

    ' Optional: Enable sorting
    DBList1.Sorted = True

    ' Optional: Enable incremental search
    DBList1.MatchEntry = 1 ' 1 = Standard matching
End Sub
```

**Handling Selection**:

```vb6
Private Sub DBList1_Change()
    ' User selected an item
    Dim selectedText As String
    Dim selectedValue As Variant

    selectedText = DBList1.Text
    selectedValue = DBList1.SelectedValue

    MsgBox "Selected: " & selectedText & " (Value: " & selectedValue & ")"
End Sub

Private Sub DBList1_DblClick()
    ' User double-clicked an item
    MsgBox "Double-clicked: " & DBList1.Text
End Sub
```

**Working with List Items**:

```vb6
' Add item manually
DBList1.AddItem "New Item"

' Remove item at index
DBList1.RemoveItem 0

' Clear all items
DBList1.Clear

' Get number of items
Dim count As Integer
count = DBList1.ListCount

' Get item at index
Dim item As String
item = DBList1.List(0)
```

**Available Data Sources**:

- `"Customers"`: CustomerID, CompanyName, Country
- `"Products"`: ProductID, ProductName, CategoryID, Price

---

### DBCombo Control

**What it does**: Dropdown or editable combo box with database binding

**Basic Setup**:

```vb6
Private Sub Form_Load()
    ' Set combo style (0=Dropdown, 1=Simple, 2=DropdownList)
    DBCombo1.Style = 0 ' Dropdown Combo (default)

    ' Set data source
    DBCombo1.RowSource = "Products"
    DBCombo1.ListField = "ProductName"
    DBCombo1.BoundColumn = 0

    ' Optional: Auto-complete as user types
    DBCombo1.MatchEntry = 1

    ' Optional: Max text length
    DBCombo1.MaxLength = 50
End Sub
```

**Handling User Input**:

```vb6
Private Sub DBCombo1_Change()
    ' Called when selection changes or text is edited
    MsgBox "Current value: " & DBCombo1.Text
End Sub

Private Sub DBCombo1_DropDown()
    ' Called when dropdown opens
    Debug.Print "Dropdown opened"
End Sub

Private Sub DBCombo1_CloseUp()
    ' Called when dropdown closes
    Debug.Print "Dropdown closed"
End Sub

Private Sub DBCombo1_KeyPress(KeyAscii As Integer)
    ' Handle keyboard input
    If KeyAscii = 13 Then ' Enter key
        MsgBox "You entered: " & DBCombo1.Text
    End If
End Sub
```

**Combo Styles Explained**:

- **Style 0 - Dropdown Combo**: Text is editable, dropdown below

  ```vb6
  DBCombo1.Style = 0
  ' User can type or select from dropdown
  ```

- **Style 1 - Simple Combo**: Text is editable, list always visible

  ```vb6
  DBCombo1.Style = 1
  ' Larger control, list always visible
  ```

- **Style 2 - Dropdown List**: Text is NOT editable, select only
  ```vb6
  DBCombo1.Style = 2
  ' Like a regular dropdown/select
  ```

**Getting Selection Value**:

```vb6
Dim text As String
Dim value As Variant
Dim index As Integer

text = DBCombo1.Text           ' Get text in input
value = DBCombo1.SelectedValue ' Get bound value
index = DBCombo1.ListIndex     ' Get selected item index
```

---

### DataRepeater Control

**What it does**: Shows multiple records in a scrollable list with repeating template

**Basic Setup**:

```vb6
Private Sub Form_Load()
    ' Set data source
    DataRepeater1.DataSource = "Products"

    ' Set how tall each record row is (in pixels)
    DataRepeater1.ReaderHeight = 60

    ' Configure what users can do
    DataRepeater1.AllowAddNew = True    ' Allow adding records
    DataRepeater1.AllowDelete = True    ' Allow deleting records
    DataRepeater1.AllowUpdate = True    ' Allow editing records

    ' Configure scrollbars
    DataRepeater1.ScrollBars = 2        ' 0=None, 1=Horizontal, 2=Vertical, 3=Both

    ' Start at first record
    DataRepeater1.CurrentRecord = 0
End Sub
```

**Navigating Records**:

```vb6
Private Sub cmdFirst_Click()
    DataRepeater1.MoveFirst
End Sub

Private Sub cmdPrevious_Click()
    DataRepeater1.MovePrevious
End Sub

Private Sub cmdNext_Click()
    DataRepeater1.MoveNext
End Sub

Private Sub cmdLast_Click()
    DataRepeater1.MoveLast
End Sub

Private Sub cmdGo_Click()
    Dim recordNum As Integer
    recordNum = InputBox("Go to record:", "Navigation")
    If recordNum >= 0 And recordNum < DataRepeater1.RecordCount Then
        DataRepeater1.CurrentRecord = recordNum
    End If
End Sub
```

**Handling Record Changes**:

```vb6
Private Sub DataRepeater1_CurrentRecordChanged()
    ' Called when user selects a different record
    MsgBox "Now viewing record " & (DataRepeater1.CurrentRecord + 1)
End Sub

Private Sub DataRepeater1_Reposition()
    ' Called after record positioning changes
    Debug.Print "Record position: " & DataRepeater1.CurrentRecord
End Sub
```

**Working with Records**:

```vb6
' Get current record number
Dim current As Integer
current = DataRepeater1.CurrentRecord

' Get total record count
Dim total As Integer
total = DataRepeater1.RecordCount

' Display current record info
Label1.Caption = "Record " & (current + 1) & " of " & total
```

**Dynamic Row Height**:

```vb6
' Adjust row height based on content
DataRepeater1.ReaderHeight = 80 ' Make rows taller for more info

' Or adjust in Form Resize
Private Sub Form_Resize()
    DataRepeater1.ReaderHeight = Me.Height \ 10
End Sub
```

---

### MSChart Control

**What it does**: Professional charting with multiple chart types

**Basic Setup**:

```vb6
Private Sub Form_Load()
    ' Set chart type (see types below)
    MSChart1.ChartType = VtChChartType.vtChChartType2dBar

    ' Show legend at bottom
    MSChart1.ShowLegend = True
    MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationBottom

    ' Add title
    MSChart1.TitleText = "Sales by Quarter"
    MSChart1.TitleLocation = VtChTitleLocation.vtChTitleLocationTop

    ' Show grid lines
    MSChart1.ShowGridLines = True

    ' Set axis titles
    MSChart1.XAxisTitle = "Quarters"
    MSChart1.YAxisTitle = "Sales ($)"

    ' Populate data and refresh
    PopulateChartData
    MSChart1.Refresh
End Sub

Private Sub PopulateChartData()
    ' Set column labels (X-axis categories)
    MSChart1.Data.ColumnLabels = Array("Q1", "Q2", "Q3", "Q4")

    ' Set row labels (series names)
    MSChart1.Data.RowLabels = Array("Product A", "Product B", "Product C")

    ' Set data values (3 series x 4 quarters)
    MSChart1.Data.Values = Array( _
        Array(100, 150, 200, 250), _
        Array(120, 160, 190, 240), _
        Array(110, 140, 180, 220) _
    )

    ' Refresh to display changes
    MSChart1.Refresh
End Sub
```

**Chart Types**:

```vb6
' 2D Charts
MSChart1.ChartType = VtChChartType.vtChChartType2dBar       ' 2D Bar Chart
MSChart1.ChartType = VtChChartType.vtChChartType2dLine      ' 2D Line Chart
MSChart1.ChartType = VtChChartType.vtChChartType2dArea      ' 2D Area Chart
MSChart1.ChartType = VtChChartType.vtChChartType2dPie       ' 2D Pie Chart

' 3D Charts
MSChart1.ChartType = VtChChartType.vtChChartType3dBar       ' 3D Bar Chart
MSChart1.ChartType = VtChChartType.vtChChartType3dLine      ' 3D Line Chart
MSChart1.ChartType = VtChChartType.vtChChartType3dArea      ' 3D Area Chart

' Other Types
MSChart1.ChartType = VtChChartType.vtChChartType2dXY        ' XY Scatter Chart
```

**Legend Positions**:

```vb6
MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationNone     ' No legend
MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationBottom   ' Bottom
MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationTop      ' Top
MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationLeft     ' Left
MSChart1.LegendLocation = VtChLegendLocation.vtChLegendLocationRight    ' Right
```

**3D Settings**:

```vb6
' Enable 3D rendering
MSChart1.Chart3D = True

' Control 3D appearance
MSChart1.Depth = 150        ' Depth effect (0-200)
MSChart1.Rotation = 30      ' Rotation angle (0-360)
MSChart1.Elevation = 20     ' Elevation angle (0-90)

' Disable 3D
MSChart1.Chart3D = False
```

**Handling Chart Clicks**:

```vb6
Private Sub MSChart1_PointSelected(Series As Integer, DataPoint As Integer)
    MsgBox "Selected Series " & Series & ", Point " & DataPoint
End Sub

Private Sub MSChart1_SeriesSelected(Series As Integer)
    MsgBox "Selected Series: " & Series
End Sub
```

**Chart Operations**:

```vb6
' Copy to clipboard
MSChart1.EditCopy

' Print chart
MSChart1.PrintChart

' Save as image
MSChart1.SaveChart "sales_chart.png", "PNG"

' Refresh display
MSChart1.Refresh

' Recalculate layout
MSChart1.Layout
```

**Updating Data Dynamically**:

```vb6
Private Sub cmdUpdateData_Click()
    ' Change data and refresh
    MSChart1.Data.Values(0)(0) = 250 ' Update first series, first point
    MSChart1.Refresh
End Sub

Private Sub Timer1_Timer()
    ' Animate chart with timer
    Static angle As Integer
    angle = angle + 5
    If angle > 360 Then angle = 0
    MSChart1.Rotation = angle
    MSChart1.Refresh
End Sub
```

---

### PictureClip Control

**What it does**: Display and navigate through sprite sheets

**Basic Setup**:

```vb6
Private Sub Form_Load()
    ' Load sprite image
    PictureClip1.Picture = "sprites.png"

    ' Set grid (16x16 sprite sheet)
    PictureClip1.Rows = 16
    PictureClip1.Cols = 16

    ' Start at first sprite
    PictureClip1.GraphicCell = 0

    ' Optional: Stretch to fill control
    PictureClip1.Stretch = False
End Sub
```

**Sprite Navigation**:

```vb6
Private Sub cmdPrevious_Click()
    ' Show previous sprite
    If PictureClip1.GraphicCell > 0 Then
        PictureClip1.GraphicCell = PictureClip1.GraphicCell - 1
    Else
        PictureClip1.GraphicCell = (16 * 16) - 1 ' Wrap to last
    End If
End Sub

Private Sub cmdNext_Click()
    ' Show next sprite
    Dim maxCells As Integer
    maxCells = PictureClip1.Rows * PictureClip1.Cols

    If PictureClip1.GraphicCell < maxCells - 1 Then
        PictureClip1.GraphicCell = PictureClip1.GraphicCell + 1
    Else
        PictureClip1.GraphicCell = 0 ' Wrap to first
    End If
End Sub

Private Sub cmdGoto_Click()
    ' Jump to specific sprite
    Dim cellNum As Integer
    cellNum = InputBox("Go to sprite number:", "Sprite")
    If cellNum >= 0 And cellNum < (PictureClip1.Rows * PictureClip1.Cols) Then
        PictureClip1.GraphicCell = cellNum
    End If
End Sub
```

**Sprite Animation**:

```vb6
' Create animation timer
Private Sub Form_Load()
    Timer1.Interval = 100 ' 100ms per frame
End Sub

Private Sub Timer1_Timer()
    ' Animate sprite
    Dim maxCells As Integer
    maxCells = PictureClip1.Rows * PictureClip1.Cols

    ' Advance to next sprite
    PictureClip1.GraphicCell = (PictureClip1.GraphicCell + 1) Mod maxCells

    ' Update frame counter
    Label1.Caption = "Frame: " & PictureClip1.GraphicCell
End Sub
```

**Different Sprite Sheets**:

```vb6
' Switch between sprite sheets
Private Sub cmbSprite_Change()
    Select Case cmbSprite.ListIndex
        Case 0
            PictureClip1.Picture = "character.png"
            PictureClip1.Rows = 4
            PictureClip1.Cols = 4
        Case 1
            PictureClip1.Picture = "enemies.png"
            PictureClip1.Rows = 8
            PictureClip1.Cols = 8
        Case 2
            PictureClip1.Picture = "items.png"
            PictureClip1.Rows = 2
            PictureClip1.Cols = 16
    End Select
    PictureClip1.GraphicCell = 0
End Sub
```

**Clipping Area Configuration**:

```vb6
' Define clipping region if not using full cells
PictureClip1.ClipX = 0      ' Starting X (pixels)
PictureClip1.ClipY = 0      ' Starting Y (pixels)
PictureClip1.ClipWidth = 32 ' Cell width (pixels)
PictureClip1.ClipHeight = 32 ' Cell height (pixels)

' Or let it auto-calculate from image size and grid
' PictureClip1.ClipWidth = 0 ' Auto
' PictureClip1.ClipHeight = 0 ' Auto
```

**Clipboard Operations**:

```vb6
' Copy current sprite to clipboard
Call PictureClip1.CopyToClipboard

' Get sprite as data URL
Dim imageURL As String
imageURL = PictureClip1.GetClipDataURL("image/png")

' Get clip dimensions
Dim rect As Object
rect = PictureClip1.GetClipRect
MsgBox "Clip: " & rect.x & "," & rect.y & " " & rect.width & "x" & rect.height
```

---

## Common Patterns

### Pattern 1: Master-Detail with DataRepeater

```vb6
' Select from list, show details in repeater
Private Sub DBList1_Change()
    ' Filter DataRepeater based on DBList selection
    DataRepeater1.DataSource = "Orders"
    DataRepeater1.MoveFirst
End Sub
```

### Pattern 2: Chart from DataRepeater Data

```vb6
Private Sub cmdShowChart_Click()
    ' Create chart from repeater data
    MSChart1.Data.ColumnLabels = Array("Jan", "Feb", "Mar")
    MSChart1.Data.RowLabels = Array("This Year", "Last Year")
    ' ... populate from repeater data
    MSChart1.Refresh
End Sub
```

### Pattern 3: Animated Sprite Loop

```vb6
Private animIndex As Integer
Private animStart As Integer
Private animEnd As Integer

Private Sub AnimateSprites()
    animStart = 0
    animEnd = 15
    animIndex = animStart
    Timer1.Enabled = True
End Sub

Private Sub Timer1_Timer()
    PictureClip1.GraphicCell = animIndex
    animIndex = animIndex + 1
    If animIndex > animEnd Then
        animIndex = animStart
    End If
End Sub
```

### Pattern 4: Dynamic Chart Updates

```vb6
Private Sub UpdateSalesChart()
    ' Fetch latest data and update chart
    With MSChart1
        .Data.Values(0) = Array(100, 120, 140, 160)
        .Data.Values(1) = Array(80, 100, 120, 140)
        .Refresh
    End With
End Sub

' Call periodically
Private Sub Timer1_Timer()
    UpdateSalesChart
End Sub
```

---

## Property Reference Quick Guide

### DBList/DBCombo Common Properties

```
DataSource      - Data source name
DataField       - Field to bind to
RowSource       - Data for list items
ListField       - Which field to display
BoundColumn     - Which column for value
ListIndex       - Selected item index
Text            - Selected text
SelectedValue   - Bound value
Sorted          - Sort alphabetically
MatchEntry      - Search mode (0/1/2)
```

### DataRepeater Properties

```
DataSource      - Data source name
CurrentRecord   - Selected record (0-based)
RecordCount     - Total records
ReaderHeight    - Height per row
ScrollBars      - Scrollbar mode (0-3)
AllowAddNew     - Allow adding
AllowDelete     - Allow deleting
AllowUpdate     - Allow editing
```

### MSChart Properties

```
ChartType       - Chart type
ShowLegend      - Show legend
LegendLocation  - Legend position
TitleText       - Chart title
ShowGridLines   - Show grid
Chart3D         - Enable 3D
Data            - Chart data object
XAxisTitle      - X-axis label
YAxisTitle      - Y-axis label
```

### PictureClip Properties

```
Picture         - Image source
Rows            - Grid rows
Cols            - Grid columns
GraphicCell     - Selected cell
Stretch         - Stretch to fit
ClipX/Y         - Clipping offset
ClipWidth/Height - Clip dimensions
```

---

## Troubleshooting

### DBList Issues

- **No data showing**: Check RowSource and ListField values
- **No selection**: Make sure list has items (ListCount > 0)
- **Change not firing**: Ensure control is enabled and not locked

### DataRepeater Issues

- **Not scrolling**: Check ScrollBars property value
- **Rows overlapping**: Increase ReaderHeight value
- **Data not showing**: Check DataSource and RecordSource

### MSChart Issues

- **No chart**: Check if data is populated and Refresh() is called
- **Wrong chart type**: Verify ChartType enum value
- **Chart is black**: Check chartBackColor property

### PictureClip Issues

- **Image not loading**: Verify picture URL is correct
- **Wrong sprite showing**: Check Rows/Cols match image grid
- **Stretched image**: Set Stretch property to False

---

## Next Steps

1. **Drag controls to your form** from the appropriate Toolbox category
2. **Set basic properties** in the Properties window
3. **Add event handlers** by double-clicking control or selecting events
4. **Test in Design mode** to see live data
5. **Run with F5** to test in execution mode
6. **Refer to CRITICAL_CONTROLS_IMPLEMENTATION.md** for advanced features

---

## Example Project Structure

```vb6
' Form: frmDataDisplay.frm
Option Explicit

' Display data
Private Sub Form_Load()
    ' Setup DBList
    DBList1.RowSource = "Customers"
    DBList1.ListField = "CompanyName"

    ' Setup DataRepeater
    DataRepeater1.DataSource = "Orders"
    DataRepeater1.ReaderHeight = 50

    ' Setup Chart
    MSChart1.ChartType = VtChChartType.vtChChartType2dBar
    PopulateChart
End Sub

Private Sub PopulateChart()
    With MSChart1
        .Data.ColumnLabels = Array("Q1", "Q2", "Q3", "Q4")
        .Data.RowLabels = Array("Sales")
        .Data.Values = Array(Array(100, 200, 150, 300))
        .Refresh
    End With
End Sub

' Event handlers
Private Sub DBList1_Change()
    MsgBox "Selected: " & DBList1.Text
End Sub

Private Sub DataRepeater1_CurrentRecordChanged()
    Label1.Caption = "Record " & (DataRepeater1.CurrentRecord + 1)
End Sub
```

Happy coding with your new VB6 controls!
