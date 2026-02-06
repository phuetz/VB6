/**
 * Test Templates for VB6 Testing Framework
 *
 * Provides pre-built test templates for common VB6 testing scenarios
 */

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'unit' | 'integration' | 'visual' | 'performance';
  code: string;
  setup?: string;
  teardown?: string;
  tags: string[];
}

export const testTemplates: TestTemplate[] = [
  {
    id: 'unit-function-test',
    name: 'Function Unit Test',
    description: 'Test a VB6 function with various inputs and expected outputs',
    category: 'Unit Testing',
    type: 'unit',
    code: `
' Test a VB6 function
Dim result As Variant

' Test with valid input
result = MyFunction("valid input")
Assert.AreEqual "expected output", result, "Function should return expected value for valid input"

' Test with empty input
result = MyFunction("")
Assert.AreEqual "", result, "Function should handle empty input gracefully"

' Test with null input
On Error Resume Next
result = MyFunction(Null)
If Err.Number <> 0 Then
  Assert.IsTrue True, "Function should handle null input appropriately"
End If
On Error GoTo 0
    `,
    tags: ['function', 'unit', 'validation'],
  },
  {
    id: 'control-property-test',
    name: 'Control Property Test',
    description: 'Test setting and getting control properties',
    category: 'Controls',
    type: 'unit',
    code: `
' Test control property behavior
Dim ctrl As Control
Set ctrl = CreateTestControl("TextBox")

' Test setting and getting text property
ctrl.Text = "Hello World"
Assert.AreEqual "Hello World", ctrl.Text, "Text property should be set correctly"

' Test property validation
ctrl.MaxLength = 10
ctrl.Text = "This is a very long text that exceeds maximum length"
Assert.IsTrue Len(ctrl.Text) <= 10, "Text should be truncated to MaxLength"

' Test property change events
Dim changeEventFired As Boolean
changeEventFired = False
' Simulate property change
Assert.IsTrue changeEventFired, "Property change event should fire"
    `,
    setup: `
Dim changeEventFired As Boolean

Private Sub TextBox1_Change()
  changeEventFired = True
End Sub

Function CreateTestControl(controlType As String) As Control
  ' Create and return test control
  Set CreateTestControl = New TextBox
End Function
    `,
    tags: ['control', 'property', 'events'],
  },
  {
    id: 'database-test',
    name: 'Database Operation Test',
    description: 'Test database connection and CRUD operations',
    category: 'Database',
    type: 'integration',
    code: `
' Test database operations
Dim conn As ADODB.Connection
Dim rs As ADODB.Recordset
Dim recordCount As Long

Set conn = GetTestConnection()
Assert.IsNotNull conn, "Database connection should be established"

' Test SELECT operation
Set rs = conn.Execute("SELECT COUNT(*) FROM TestTable")
Assert.IsNotNull rs, "Recordset should be returned"
recordCount = rs.Fields(0).Value
rs.Close

' Test INSERT operation
conn.Execute "INSERT INTO TestTable (Name, Value) VALUES ('Test', 123)"
Set rs = conn.Execute("SELECT COUNT(*) FROM TestTable")
Assert.AreEqual recordCount + 1, rs.Fields(0).Value, "Record count should increase after INSERT"
rs.Close

' Test UPDATE operation
conn.Execute "UPDATE TestTable SET Value = 456 WHERE Name = 'Test'"
Set rs = conn.Execute("SELECT Value FROM TestTable WHERE Name = 'Test'")
Assert.AreEqual 456, rs.Fields(0).Value, "Record should be updated"
rs.Close

' Test DELETE operation
conn.Execute "DELETE FROM TestTable WHERE Name = 'Test'"
Set rs = conn.Execute("SELECT COUNT(*) FROM TestTable")
Assert.AreEqual recordCount, rs.Fields(0).Value, "Record count should return to original after DELETE"
rs.Close
    `,
    setup: `
Function GetTestConnection() As ADODB.Connection
  Dim conn As ADODB.Connection
  Set conn = New ADODB.Connection
  conn.ConnectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=test.mdb;"
  conn.Open
  Set GetTestConnection = conn
End Function
    `,
    teardown: `
If Not conn Is Nothing Then
  conn.Close
  Set conn = Nothing
End If
Set rs = Nothing
    `,
    tags: ['database', 'ado', 'crud'],
  },
  {
    id: 'form-load-test',
    name: 'Form Load Test',
    description: 'Test form loading and initialization',
    category: 'Forms',
    type: 'integration',
    code: `
' Test form loading and initialization
Dim frm As Form
Set frm = New TestForm

' Test form properties after load
frm.Show
Assert.AreEqual "Test Form", frm.Caption, "Form caption should be set correctly"
Assert.IsTrue frm.Visible, "Form should be visible after Show"

' Test form controls initialization
Assert.IsNotNull frm.Controls("btnOK"), "OK button should exist"
Assert.IsNotNull frm.Controls("txtInput"), "Input textbox should exist"

' Test default values
Assert.AreEqual "", frm.txtInput.Text, "Input should be empty by default"
Assert.IsTrue frm.btnOK.Enabled, "OK button should be enabled by default"

' Test form events
Dim loadEventFired As Boolean
loadEventFired = False
' Form_Load should have fired
Assert.IsTrue loadEventFired, "Form_Load event should fire during Show"
    `,
    teardown: `
If Not frm Is Nothing Then
  Unload frm
  Set frm = Nothing
End If
    `,
    tags: ['form', 'initialization', 'events'],
  },
  {
    id: 'error-handling-test',
    name: 'Error Handling Test',
    description: 'Test error handling and exception scenarios',
    category: 'Error Handling',
    type: 'unit',
    code: `
' Test error handling
Dim errorOccurred As Boolean
Dim errorNumber As Long
Dim errorDescription As String

' Test division by zero
On Error GoTo ErrorHandler
errorOccurred = False
Dim result As Double
result = 10 / 0  ' This should cause an error
Assert.IsTrue False, "Should not reach this line - error expected"

ErrorHandler:
  errorOccurred = True
  errorNumber = Err.Number
  errorDescription = Err.Description
  Resume Next

Assert.IsTrue errorOccurred, "Error should have occurred for division by zero"
Assert.AreEqual 11, errorNumber, "Error number should be 11 (division by zero)"

' Test file not found error
On Error GoTo FileErrorHandler
errorOccurred = False
Open "NonExistentFile.txt" For Input As #1
Assert.IsTrue False, "Should not reach this line - file error expected"

FileErrorHandler:
  errorOccurred = True
  errorNumber = Err.Number
  Resume Next

Assert.IsTrue errorOccurred, "Error should have occurred for missing file"
Assert.AreEqual 53, errorNumber, "Error number should be 53 (file not found)"
    `,
    tags: ['error', 'exception', 'validation'],
  },
  {
    id: 'string-functions-test',
    name: 'String Functions Test',
    description: 'Test VB6 string manipulation functions',
    category: 'Functions',
    type: 'unit',
    code: `
' Test string functions
Dim testString As String
Dim result As String

testString = "  Hello World  "

' Test trimming functions
Assert.AreEqual "Hello World", Trim(testString), "Trim should remove leading and trailing spaces"
Assert.AreEqual "Hello World  ", LTrim(testString), "LTrim should remove leading spaces only"
Assert.AreEqual "  Hello World", RTrim(testString), "RTrim should remove trailing spaces only"

' Test case conversion
Assert.AreEqual "HELLO WORLD", UCase("Hello World"), "UCase should convert to uppercase"
Assert.AreEqual "hello world", LCase("Hello World"), "LCase should convert to lowercase"

' Test substring functions
Assert.AreEqual "Hello", Left("Hello World", 5), "Left should return first 5 characters"
Assert.AreEqual "World", Right("Hello World", 5), "Right should return last 5 characters"
Assert.AreEqual "lo Wo", Mid("Hello World", 4, 5), "Mid should return substring from position 4, length 5"

' Test string length and position
Assert.AreEqual 11, Len("Hello World"), "Len should return string length"
Assert.AreEqual 7, InStr("Hello World", "World"), "InStr should return position of substring"
Assert.AreEqual 0, InStr("Hello World", "xyz"), "InStr should return 0 for non-existent substring"

' Test string replacement
Assert.AreEqual "Hello Universe", Replace("Hello World", "World", "Universe"), "Replace should substitute text"
    `,
    tags: ['string', 'functions', 'manipulation'],
  },
  {
    id: 'array-operations-test',
    name: 'Array Operations Test',
    description: 'Test VB6 array operations and functions',
    category: 'Arrays',
    type: 'unit',
    code: `
' Test array operations
Dim arr() As Integer
Dim strArr() As String
Dim i As Integer

' Test dynamic array resizing
ReDim arr(1 To 5)
For i = 1 To 5
  arr(i) = i * 10
Next i

Assert.AreEqual 1, LBound(arr), "Array lower bound should be 1"
Assert.AreEqual 5, UBound(arr), "Array upper bound should be 5"
Assert.AreEqual 50, arr(5), "Last element should be 50"

' Test preserving data during resize
ReDim Preserve arr(1 To 10)
Assert.AreEqual 10, UBound(arr), "Array should be resized to 10 elements"
Assert.AreEqual 50, arr(5), "Original data should be preserved"

' Test string arrays
ReDim strArr(0 To 2)
strArr(0) = "First"
strArr(1) = "Second"
strArr(2) = "Third"

Assert.AreEqual "Second", strArr(1), "String array element should be accessible"

' Test Join and Split functions
Dim joinedStr As String
joinedStr = Join(strArr, ", ")
Assert.AreEqual "First, Second, Third", joinedStr, "Join should concatenate array elements"

Dim splitArr() As String
splitArr = Split(joinedStr, ", ")
Assert.AreEqual 3, UBound(splitArr) + 1, "Split should create array with 3 elements"
Assert.AreEqual "First", splitArr(0), "First split element should match"
    `,
    tags: ['array', 'redim', 'split', 'join'],
  },
  {
    id: 'performance-test',
    name: 'Performance Benchmark Test',
    description: 'Measure and validate performance of operations',
    category: 'Performance',
    type: 'performance',
    code: `
' Performance test
Dim startTime As Double
Dim endTime As Double
Dim duration As Double
Dim i As Long
Dim result As Long

' Test loop performance
startTime = Timer
For i = 1 To 100000
  result = result + i
Next i
endTime = Timer
duration = endTime - startTime

Assert.IsTrue duration < 1, "Loop should complete within 1 second"
Assert.AreEqual 5000050000#, result, "Loop calculation should be correct"

' Test string concatenation performance
Dim testStr As String
startTime = Timer
For i = 1 To 1000
  testStr = testStr & "A"
Next i
endTime = Timer
duration = endTime - startTime

Assert.IsTrue duration < 0.5, "String concatenation should complete within 0.5 seconds"
Assert.AreEqual 1000, Len(testStr), "Final string should be 1000 characters long"

' Test file I/O performance
Dim fileName As String
fileName = "test_performance.txt"

startTime = Timer
Open fileName For Output As #1
For i = 1 To 1000
  Print #1, "Line " & i
Next i
Close #1
endTime = Timer
duration = endTime - startTime

Assert.IsTrue duration < 2, "File writing should complete within 2 seconds"

' Clean up
Kill fileName
    `,
    tags: ['performance', 'benchmark', 'timing'],
  },
  {
    id: 'visual-test',
    name: 'Visual Regression Test',
    description: 'Test visual appearance and layout of controls',
    category: 'Visual',
    type: 'visual',
    code: `
' Visual regression test
Dim frm As Form
Dim snapshot As String

Set frm = New TestForm
frm.Show

' Wait for form to fully render
DoEvents
Sleep 500

' Capture visual snapshot
snapshot = CaptureFormSnapshot(frm)
Assert.IsNotNull snapshot, "Should capture form snapshot"

' Compare with baseline
Dim baselineSnapshot As String
baselineSnapshot = LoadBaselineSnapshot("TestForm_Baseline")
Dim visualMatch As Boolean
visualMatch = CompareSnapshots(snapshot, baselineSnapshot, 0.95) ' 95% similarity threshold

Assert.IsTrue visualMatch, "Form appearance should match baseline within threshold"

' Test control positioning
Dim btnOK As CommandButton
Set btnOK = frm.Controls("btnOK")

Assert.AreEqual 100, btnOK.Left, "OK button should be positioned at Left=100"
Assert.AreEqual 200, btnOK.Top, "OK button should be positioned at Top=200"
Assert.AreEqual 75, btnOK.Width, "OK button should have Width=75"
Assert.AreEqual 25, btnOK.Height, "OK button should have Height=25"

' Test font properties
Assert.AreEqual "MS Sans Serif", btnOK.Font.Name, "Button font should be MS Sans Serif"
Assert.AreEqual 8, btnOK.Font.Size, "Button font size should be 8"
    `,
    setup: `
Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

Function CaptureFormSnapshot(frm As Form) As String
  ' Implementation would capture form screenshot
  CaptureFormSnapshot = "snapshot_" & Timer
End Function

Function LoadBaselineSnapshot(name As String) As String
  ' Implementation would load baseline image
  LoadBaselineSnapshot = "baseline_" & name
End Function

Function CompareSnapshots(snapshot1 As String, snapshot2 As String, threshold As Double) As Boolean
  ' Implementation would compare images
  CompareSnapshots = True ' Simplified for template
End Function
    `,
    teardown: `
If Not frm Is Nothing Then
  Unload frm
  Set frm = Nothing
End If
    `,
    tags: ['visual', 'regression', 'ui', 'layout'],
  },
];

/**
 * Get test templates by category
 */
export function getTemplatesByCategory(category: string): TestTemplate[] {
  return testTemplates.filter(template => template.category === category);
}

/**
 * Get test templates by type
 */
export function getTemplatesByType(
  type: 'unit' | 'integration' | 'visual' | 'performance'
): TestTemplate[] {
  return testTemplates.filter(template => template.type === type);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = testTemplates.map(template => template.category);
  return [...new Set(categories)];
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): TestTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return testTemplates.filter(
    template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}
