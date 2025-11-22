export interface VB6Snippet {
  id: string;
  name: string;
  prefix: string;
  description: string;
  category: string;
  body: string;
  placeholders?: Array<{
    id: string;
    label: string;
    defaultValue: string;
  }>;
}

export const vb6Snippets: VB6Snippet[] = [
  // Declarations
  {
    id: 'dim',
    name: 'Dim Variable',
    prefix: 'dim',
    description: 'Declare a variable',
    category: 'declaration',
    body: 'Dim ${1:variableName} As ${2:String}',
    placeholders: [
      { id: '1', label: 'Variable Name', defaultValue: 'variableName' },
      { id: '2', label: 'Data Type', defaultValue: 'String' }
    ]
  },
  {
    id: 'const',
    name: 'Constant',
    prefix: 'const',
    description: 'Declare a constant',
    category: 'declaration',
    body: 'Const ${1:CONSTANT_NAME} As ${2:String} = "${3:value}"',
    placeholders: [
      { id: '1', label: 'Constant Name', defaultValue: 'CONSTANT_NAME' },
      { id: '2', label: 'Data Type', defaultValue: 'String' },
      { id: '3', label: 'Value', defaultValue: 'value' }
    ]
  },
  {
    id: 'global',
    name: 'Global Variable',
    prefix: 'global',
    description: 'Declare a global variable',
    category: 'declaration',
    body: 'Global ${1:variableName} As ${2:String}',
    placeholders: [
      { id: '1', label: 'Variable Name', defaultValue: 'variableName' },
      { id: '2', label: 'Data Type', defaultValue: 'String' }
    ]
  },
  {
    id: 'public',
    name: 'Public Variable',
    prefix: 'public',
    description: 'Declare a public variable',
    category: 'declaration',
    body: 'Public ${1:variableName} As ${2:String}',
    placeholders: [
      { id: '1', label: 'Variable Name', defaultValue: 'variableName' },
      { id: '2', label: 'Data Type', defaultValue: 'String' }
    ]
  },
  {
    id: 'enum',
    name: 'Enumeration',
    prefix: 'enum',
    description: 'Create an enumeration',
    category: 'declaration',
    body: 'Enum ${1:EnumName}\\n    ${2:FirstValue} = 0\\n    ${3:SecondValue} = 1\\n    ${4:ThirdValue} = 2\\nEnd Enum',
    placeholders: [
      { id: '1', label: 'Enum Name', defaultValue: 'EnumName' },
      { id: '2', label: 'First Value', defaultValue: 'FirstValue' },
      { id: '3', label: 'Second Value', defaultValue: 'SecondValue' },
      { id: '4', label: 'Third Value', defaultValue: 'ThirdValue' }
    ]
  },
  {
    id: 'type',
    name: 'User Defined Type',
    prefix: 'type',
    description: 'Create a user-defined type',
    category: 'declaration',
    body: 'Type ${1:TypeName}\\n    ${2:Field1} As ${3:String}\\n    ${4:Field2} As ${5:Integer}\\nEnd Type',
    placeholders: [
      { id: '1', label: 'Type Name', defaultValue: 'TypeName' },
      { id: '2', label: 'Field 1 Name', defaultValue: 'Field1' },
      { id: '3', label: 'Field 1 Type', defaultValue: 'String' },
      { id: '4', label: 'Field 2 Name', defaultValue: 'Field2' },
      { id: '5', label: 'Field 2 Type', defaultValue: 'Integer' }
    ]
  },

  // Functions
  {
    id: 'sub',
    name: 'Subroutine',
    prefix: 'sub',
    description: 'Create a subroutine',
    category: 'function',
    body: 'Private Sub ${1:ProcedureName}(${2:})\\n    ${3:Code here}\\nEnd Sub',
    placeholders: [
      { id: '1', label: 'Procedure Name', defaultValue: 'ProcedureName' },
      { id: '2', label: 'Parameters', defaultValue: '' },
      { id: '3', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'func',
    name: 'Function',
    prefix: 'func',
    description: 'Create a function',
    category: 'function',
    body: 'Private Function ${1:FunctionName}(${2:}) As ${3:String}\\n    ${4:Code here}\\n    ${1:FunctionName} = ${5:result}\\nEnd Function',
    placeholders: [
      { id: '1', label: 'Function Name', defaultValue: 'FunctionName' },
      { id: '2', label: 'Parameters', defaultValue: '' },
      { id: '3', label: 'Return Type', defaultValue: 'String' },
      { id: '4', label: 'Code', defaultValue: "'Code here" },
      { id: '5', label: 'Return Value', defaultValue: 'result' }
    ]
  },
  {
    id: 'prop',
    name: 'Property Get',
    prefix: 'prop',
    description: 'Create a property getter',
    category: 'function',
    body: 'Public Property Get ${1:PropertyName}() As ${2:String}\\n    ${1:PropertyName} = ${3:m_PropertyName}\\nEnd Property',
    placeholders: [
      { id: '1', label: 'Property Name', defaultValue: 'PropertyName' },
      { id: '2', label: 'Return Type', defaultValue: 'String' },
      { id: '3', label: 'Member Variable', defaultValue: 'm_PropertyName' }
    ]
  },
  {
    id: 'proplet',
    name: 'Property Let',
    prefix: 'proplet',
    description: 'Create a property setter',
    category: 'function',
    body: 'Public Property Let ${1:PropertyName}(ByVal ${2:value} As ${3:String})\\n    ${4:m_PropertyName} = ${2:value}\\nEnd Property',
    placeholders: [
      { id: '1', label: 'Property Name', defaultValue: 'PropertyName' },
      { id: '2', label: 'Parameter Name', defaultValue: 'value' },
      { id: '3', label: 'Parameter Type', defaultValue: 'String' },
      { id: '4', label: 'Member Variable', defaultValue: 'm_PropertyName' }
    ]
  },
  {
    id: 'propset',
    name: 'Property Set',
    prefix: 'propset',
    description: 'Create a property setter for objects',
    category: 'function',
    body: 'Public Property Set ${1:PropertyName}(ByVal ${2:value} As ${3:Object})\\n    Set ${4:m_PropertyName} = ${2:value}\\nEnd Property',
    placeholders: [
      { id: '1', label: 'Property Name', defaultValue: 'PropertyName' },
      { id: '2', label: 'Parameter Name', defaultValue: 'value' },
      { id: '3', label: 'Parameter Type', defaultValue: 'Object' },
      { id: '4', label: 'Member Variable', defaultValue: 'm_PropertyName' }
    ]
  },

  // Conditions
  {
    id: 'if',
    name: 'If Statement',
    prefix: 'if',
    description: 'If-then statement',
    category: 'condition',
    body: 'If ${1:condition} Then\\n    ${2:Code here}\\nEnd If',
    placeholders: [
      { id: '1', label: 'Condition', defaultValue: 'condition' },
      { id: '2', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'ifelse',
    name: 'If-Else Statement',
    prefix: 'ifelse',
    description: 'If-then-else statement',
    category: 'condition',
    body: 'If ${1:condition} Then\\n    ${2:True code}\\nElse\\n    ${3:False code}\\nEnd If',
    placeholders: [
      { id: '1', label: 'Condition', defaultValue: 'condition' },
      { id: '2', label: 'True Code', defaultValue: "'True code" },
      { id: '3', label: 'False Code', defaultValue: "'False code" }
    ]
  },
  {
    id: 'ifelseif',
    name: 'If-ElseIf-Else Statement',
    prefix: 'ifelseif',
    description: 'If-then-elseif-else statement',
    category: 'condition',
    body: 'If ${1:condition1} Then\\n    ${2:Code 1}\\nElseIf ${3:condition2} Then\\n    ${4:Code 2}\\nElse\\n    ${5:Default code}\\nEnd If',
    placeholders: [
      { id: '1', label: 'First Condition', defaultValue: 'condition1' },
      { id: '2', label: 'First Code', defaultValue: "'Code 1" },
      { id: '3', label: 'Second Condition', defaultValue: 'condition2' },
      { id: '4', label: 'Second Code', defaultValue: "'Code 2" },
      { id: '5', label: 'Default Code', defaultValue: "'Default code" }
    ]
  },
  {
    id: 'select',
    name: 'Select Case',
    prefix: 'select',
    description: 'Select case statement',
    category: 'condition',
    body: 'Select Case ${1:expression}\\n    Case ${2:value1}\\n        ${3:Code 1}\\n    Case ${4:value2}\\n        ${5:Code 2}\\n    Case Else\\n        ${6:Default code}\\nEnd Select',
    placeholders: [
      { id: '1', label: 'Expression', defaultValue: 'expression' },
      { id: '2', label: 'Value 1', defaultValue: 'value1' },
      { id: '3', label: 'Code 1', defaultValue: "'Code 1" },
      { id: '4', label: 'Value 2', defaultValue: 'value2' },
      { id: '5', label: 'Code 2', defaultValue: "'Code 2" },
      { id: '6', label: 'Default Code', defaultValue: "'Default code" }
    ]
  },

  // Loops
  {
    id: 'for',
    name: 'For Loop',
    prefix: 'for',
    description: 'For-Next loop',
    category: 'loop',
    body: 'For ${1:i} = ${2:1} To ${3:10}\\n    ${4:Code here}\\nNext ${1:i}',
    placeholders: [
      { id: '1', label: 'Counter Variable', defaultValue: 'i' },
      { id: '2', label: 'Start Value', defaultValue: '1' },
      { id: '3', label: 'End Value', defaultValue: '10' },
      { id: '4', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'forstep',
    name: 'For Loop with Step',
    prefix: 'forstep',
    description: 'For-Next loop with step',
    category: 'loop',
    body: 'For ${1:i} = ${2:1} To ${3:10} Step ${4:2}\\n    ${5:Code here}\\nNext ${1:i}',
    placeholders: [
      { id: '1', label: 'Counter Variable', defaultValue: 'i' },
      { id: '2', label: 'Start Value', defaultValue: '1' },
      { id: '3', label: 'End Value', defaultValue: '10' },
      { id: '4', label: 'Step Value', defaultValue: '2' },
      { id: '5', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'foreach',
    name: 'For Each Loop',
    prefix: 'foreach',
    description: 'For each loop',
    category: 'loop',
    body: 'For Each ${1:item} In ${2:collection}\\n    ${3:Code here}\\nNext ${1:item}',
    placeholders: [
      { id: '1', label: 'Item Variable', defaultValue: 'item' },
      { id: '2', label: 'Collection', defaultValue: 'collection' },
      { id: '3', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'while',
    name: 'While Loop',
    prefix: 'while',
    description: 'While-Wend loop',
    category: 'loop',
    body: 'While ${1:condition}\\n    ${2:Code here}\\nWend',
    placeholders: [
      { id: '1', label: 'Condition', defaultValue: 'condition' },
      { id: '2', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'dowhile',
    name: 'Do While Loop',
    prefix: 'dowhile',
    description: 'Do while loop',
    category: 'loop',
    body: 'Do While ${1:condition}\\n    ${2:Code here}\\nLoop',
    placeholders: [
      { id: '1', label: 'Condition', defaultValue: 'condition' },
      { id: '2', label: 'Code', defaultValue: "'Code here" }
    ]
  },
  {
    id: 'dountil',
    name: 'Do Until Loop',
    prefix: 'dountil',
    description: 'Do until loop',
    category: 'loop',
    body: 'Do Until ${1:condition}\\n    ${2:Code here}\\nLoop',
    placeholders: [
      { id: '1', label: 'Condition', defaultValue: 'condition' },
      { id: '2', label: 'Code', defaultValue: "'Code here" }
    ]
  },

  // Error Handling
  {
    id: 'onerror',
    name: 'On Error GoTo',
    prefix: 'onerror',
    description: 'Error handling with GoTo',
    category: 'error',
    body: 'On Error GoTo ErrorHandler\\n\\n${1:Main code here}\\n\\nExit Sub\\n\\nErrorHandler:\\n    ${2:Error handling code}',
    placeholders: [
      { id: '1', label: 'Main Code', defaultValue: "'Main code here" },
      { id: '2', label: 'Error Handling Code', defaultValue: "'Error handling code" }
    ]
  },
  {
    id: 'onerrorresume',
    name: 'On Error Resume Next',
    prefix: 'onerrorresume',
    description: 'Continue on error',
    category: 'error',
    body: 'On Error Resume Next\\n${1:Code here}\\nIf Err.Number <> 0 Then\\n    ${2:Handle error}\\nEnd If',
    placeholders: [
      { id: '1', label: 'Code', defaultValue: "'Code here" },
      { id: '2', label: 'Error Handling', defaultValue: "'Handle error" }
    ]
  },
  {
    id: 'errorhandler',
    name: 'Error Handler Block',
    prefix: 'errorhandler',
    description: 'Complete error handler',
    category: 'error',
    body: 'ErrorHandler:\\n    Select Case Err.Number\\n        Case ${1:errorNumber}\\n            ${2:Handle specific error}\\n        Case Else\\n            ${3:Handle general error}\\n    End Select\\n    Resume Next',
    placeholders: [
      { id: '1', label: 'Error Number', defaultValue: 'errorNumber' },
      { id: '2', label: 'Specific Error Code', defaultValue: "'Handle specific error" },
      { id: '3', label: 'General Error Code', defaultValue: "'Handle general error" }
    ]
  },

  // Control Events
  {
    id: 'formload',
    name: 'Form Load Event',
    prefix: 'formload',
    description: 'Form Load event handler',
    category: 'control',
    body: 'Private Sub Form_Load()\\n    ${1:Initialization code}\\nEnd Sub',
    placeholders: [
      { id: '1', label: 'Initialization Code', defaultValue: "'Initialization code" }
    ]
  },
  {
    id: 'click',
    name: 'Click Event',
    prefix: 'click',
    description: 'Control click event handler',
    category: 'control',
    body: 'Private Sub ${1:Command1}_Click()\\n    ${2:Click code}\\nEnd Sub',
    placeholders: [
      { id: '1', label: 'Control Name', defaultValue: 'Command1' },
      { id: '2', label: 'Click Code', defaultValue: "'Click code" }
    ]
  },
  {
    id: 'change',
    name: 'Change Event',
    prefix: 'change',
    description: 'Control change event handler',
    category: 'control',
    body: 'Private Sub ${1:Text1}_Change()\\n    ${2:Change code}\\nEnd Sub',
    placeholders: [
      { id: '1', label: 'Control Name', defaultValue: 'Text1' },
      { id: '2', label: 'Change Code', defaultValue: "'Change code" }
    ]
  },
  {
    id: 'listclick',
    name: 'List Click Event',
    prefix: 'listclick',
    description: 'List control click event',
    category: 'control',
    body: 'Private Sub ${1:List1}_Click()\\n    If ${1:List1}.ListIndex >= 0 Then\\n        ${2:Handle selection}\\n    End If\\nEnd Sub',
    placeholders: [
      { id: '1', label: 'List Control Name', defaultValue: 'List1' },
      { id: '2', label: 'Selection Code', defaultValue: "'Handle selection" }
    ]
  },

  // File Operations
  {
    id: 'fileopen',
    name: 'Open File',
    prefix: 'fileopen',
    description: 'Open a file for reading',
    category: 'file',
    body: 'Dim fileNum As Integer\\nDim fileContent As String\\nfileNum = FreeFile\\nOpen "${1:filename.txt}" For Input As #fileNum\\n${2:Read file content}\\nClose #fileNum',
    placeholders: [
      { id: '1', label: 'Filename', defaultValue: 'filename.txt' },
      { id: '2', label: 'File Processing Code', defaultValue: "'Read file content" }
    ]
  },
  {
    id: 'filewrite',
    name: 'Write File',
    prefix: 'filewrite',
    description: 'Write to a file',
    category: 'file',
    body: 'Dim fileNum As Integer\\nfileNum = FreeFile\\nOpen "${1:filename.txt}" For Output As #fileNum\\nPrint #fileNum, "${2:content}"\\nClose #fileNum',
    placeholders: [
      { id: '1', label: 'Filename', defaultValue: 'filename.txt' },
      { id: '2', label: 'Content', defaultValue: 'content' }
    ]
  },
  {
    id: 'fileappend',
    name: 'Append to File',
    prefix: 'fileappend',
    description: 'Append to a file',
    category: 'file',
    body: 'Dim fileNum As Integer\\nfileNum = FreeFile\\nOpen "${1:filename.txt}" For Append As #fileNum\\nPrint #fileNum, "${2:content}"\\nClose #fileNum',
    placeholders: [
      { id: '1', label: 'Filename', defaultValue: 'filename.txt' },
      { id: '2', label: 'Content', defaultValue: 'content' }
    ]
  },

  // Database Operations
  {
    id: 'adoconnect',
    name: 'ADO Connection',
    prefix: 'adoconnect',
    description: 'Create ADO database connection',
    category: 'database',
    body: 'Dim conn As ADODB.Connection\\nSet conn = New ADODB.Connection\\nconn.ConnectionString = "${1:connection_string}"\\nconn.Open\\n${2:Database operations}\\nconn.Close\\nSet conn = Nothing',
    placeholders: [
      { id: '1', label: 'Connection String', defaultValue: 'connection_string' },
      { id: '2', label: 'Database Operations', defaultValue: "'Database operations" }
    ]
  },
  {
    id: 'adorecordset',
    name: 'ADO Recordset',
    prefix: 'adorecordset',
    description: 'Create ADO recordset',
    category: 'database',
    body: 'Dim rs As ADODB.Recordset\\nSet rs = New ADODB.Recordset\\nrs.Open "${1:SELECT * FROM table}", conn, adOpenStatic, adLockReadOnly\\nDo While Not rs.EOF\\n    ${2:Process record}\\n    rs.MoveNext\\nLoop\\nrs.Close\\nSet rs = Nothing',
    placeholders: [
      { id: '1', label: 'SQL Query', defaultValue: 'SELECT * FROM table' },
      { id: '2', label: 'Record Processing', defaultValue: "'Process record" }
    ]
  },

  // Common Functions
  {
    id: 'msgbox',
    name: 'Message Box',
    prefix: 'msgbox',
    description: 'Display a message box',
    category: 'common',
    body: 'MsgBox "${1:message}", vbInformation, "${2:title}"',
    placeholders: [
      { id: '1', label: 'Message', defaultValue: 'message' },
      { id: '2', label: 'Title', defaultValue: 'title' }
    ]
  },
  {
    id: 'inputbox',
    name: 'Input Box',
    prefix: 'inputbox',
    description: 'Get user input',
    category: 'common',
    body: 'Dim ${1:userInput} As String\\n${1:userInput} = InputBox("${2:prompt}", "${3:title}", "${4:default}")',
    placeholders: [
      { id: '1', label: 'Variable Name', defaultValue: 'userInput' },
      { id: '2', label: 'Prompt', defaultValue: 'prompt' },
      { id: '3', label: 'Title', defaultValue: 'title' },
      { id: '4', label: 'Default Value', defaultValue: 'default' }
    ]
  },

  // API Declarations
  {
    id: 'apideclare',
    name: 'API Declaration',
    prefix: 'apideclare',
    description: 'Declare Windows API function',
    category: 'api',
    body: 'Private Declare Sub ${1:FunctionName} Lib "${2:library}" (${3:parameters})',
    placeholders: [
      { id: '1', label: 'Function Name', defaultValue: 'FunctionName' },
      { id: '2', label: 'Library', defaultValue: 'library' },
      { id: '3', label: 'Parameters', defaultValue: 'parameters' }
    ]
  },
  {
    id: 'sleepapi',
    name: 'Sleep API',
    prefix: 'sleepapi',
    description: 'Windows Sleep API declaration',
    category: 'api',
    body: 'Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)'
  }
];

// Helper functions
export function getSnippetsByCategory(category: string): VB6Snippet[] {
  return vb6Snippets.filter(snippet => snippet.category === category);
}

export function searchSnippets(query: string): VB6Snippet[] {
  const lowercaseQuery = query.toLowerCase();
  return vb6Snippets.filter(snippet =>
    snippet.name.toLowerCase().includes(lowercaseQuery) ||
    snippet.prefix.toLowerCase().includes(lowercaseQuery) ||
    snippet.description.toLowerCase().includes(lowercaseQuery) ||
    snippet.body.toLowerCase().includes(lowercaseQuery)
  );
}

export function getSnippetById(id: string): VB6Snippet | undefined {
  return vb6Snippets.find(snippet => snippet.id === id);
}

export function getSnippetByPrefix(prefix: string): VB6Snippet | undefined {
  return vb6Snippets.find(snippet => snippet.prefix === prefix);
}