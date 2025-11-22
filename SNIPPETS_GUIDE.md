# VB6 Web IDE - Code Snippets & IntelliSense Guide

## Overview

The VB6 Web IDE now includes comprehensive code snippets and enhanced IntelliSense, providing faster coding with intelligent auto-completion and ready-to-use code templates.

## 🚀 Features

### 1. **Code Snippets**
Pre-built code templates that expand into full code structures with placeholders.

### 2. **Enhanced IntelliSense**
Context-aware auto-completion for:
- VB6 keywords
- Built-in functions
- Control properties and methods
- User-defined variables and functions
- Code snippets

## 📝 Using Code Snippets

### Activation
1. **Type the prefix**: Start typing the snippet prefix (e.g., `dim`, `for`, `if`)
2. **Press Ctrl+Space**: Show IntelliSense suggestions
3. **Select snippet**: Choose from the list (snippets appear first with a special icon)
4. **Press Tab/Enter**: Insert the snippet
5. **Tab through placeholders**: Navigate between customizable fields

### Example
```vb
' Type "for" and press Tab:
For ${1:i} = ${2:1} To ${3:10}
    ${4:' Code here}
Next ${1:i}

' Becomes:
For i = 1 To 10
    ' Code here
Next i
```

## 📚 Available Snippets

### Declarations
| Prefix | Name | Description |
|--------|------|-------------|
| `dim` | Declare Variable | `Dim variableName As String` |
| `dima` | Declare Array | `Dim arrayName(10) As Integer` |
| `const` | Declare Constant | `Const CONSTANT_NAME As String = "value"` |
| `enum` | Enumeration | Create an enumeration |
| `type` | User Defined Type | Create a custom type |

### Functions & Procedures
| Prefix | Name | Description |
|--------|------|-------------|
| `sub` | Sub Procedure | Create a new Sub |
| `func` | Function | Create a new Function |
| `propg` | Property Get | Property getter |
| `propl` | Property Let | Property setter |
| `props` | Property Set | Property setter for objects |

### Control Structures
| Prefix | Name | Description |
|--------|------|-------------|
| `if` | If Statement | `If...Then...End If` |
| `ife` | If-Else Statement | `If...Then...Else...End If` |
| `ifeif` | If-ElseIf Statement | `If...ElseIf...Else...End If` |
| `select` | Select Case | `Select Case...End Select` |

### Loops
| Prefix | Name | Description |
|--------|------|-------------|
| `for` | For Loop | `For...Next` loop |
| `fors` | For Loop with Step | `For...Step...Next` |
| `foreach` | For Each Loop | `For Each...In...Next` |
| `while` | While Loop | `While...Wend` |
| `dow` | Do While Loop | `Do While...Loop` |
| `dou` | Do Until Loop | `Do Until...Loop` |

### Error Handling
| Prefix | Name | Description |
|--------|------|-------------|
| `err` | Error Handler | Complete error handling structure |
| `oern` | On Error Resume Next | Ignore errors |
| `oerg` | On Error GoTo | Go to error handler |

### Control Events
| Prefix | Name | Description |
|--------|------|-------------|
| `formload` | Form Load Event | Form_Load handler |
| `btnclick` | Button Click Event | Command button click |
| `txtchange` | TextBox Change Event | Text change handler |
| `lstclick` | ListBox Click Event | List selection handler |

### File Operations
| Prefix | Name | Description |
|--------|------|-------------|
| `fopen` | Open File | Open file for reading/writing |
| `fread` | Read File | Read entire file content |
| `fwrite` | Write to File | Write content to file |

### Database
| Prefix | Name | Description |
|--------|------|-------------|
| `adoconn` | ADO Connection | Create database connection |
| `adors` | ADO Recordset | Create and use recordset |

### Common Patterns
| Prefix | Name | Description |
|--------|------|-------------|
| `msg` | Message Box | Show a message box |
| `inp` | Input Box | Show an input box |

### API Declarations
| Prefix | Name | Description |
|--------|------|-------------|
| `api` | API Declaration | Declare Windows API function |
| `sleep` | Sleep API | Declare and use Sleep API |

## 🎯 IntelliSense Features

### Context-Aware Suggestions

#### 1. **After typing a dot (.)**
Shows object members:
```vb
Text1.  ' Shows: Text, SelText, SelStart, etc.
Me.     ' Shows: form properties and methods
```

#### 2. **After typing "As"**
Shows data types:
```vb
Dim x As  ' Shows: String, Integer, Long, etc.
```

#### 3. **In function calls**
Shows parameter hints:
```vb
MsgBox(  ' Shows signature with parameters
```

#### 4. **General context**
Shows everything relevant:
- Keywords
- Functions
- Variables
- Controls
- Snippets

### Keyboard Shortcuts

- **Ctrl+Space**: Trigger IntelliSense manually
- **Tab/Enter**: Accept suggestion
- **Esc**: Cancel IntelliSense
- **↑↓**: Navigate suggestions
- **Ctrl+Space** (in IntelliSense): Toggle details panel

## 💡 Tips & Tricks

### 1. **Quick Variable Declaration**
Type `dim` + Tab to quickly declare a variable:
```vb
dim myVar String  ' Expands to: Dim myVar As String
```

### 2. **Fast Loop Creation**
Type `for` + Tab for instant loop:
```vb
for i 1 10  ' Expands to full For loop
```

### 3. **Error Handling Template**
Type `err` + Tab for complete error handling:
```vb
err  ' Expands to full error handling structure
```

### 4. **Snippet Customization**
After inserting a snippet:
1. First placeholder is selected
2. Type to replace it
3. Press Tab to go to next placeholder
4. All instances of same placeholder update together

### 5. **IntelliSense Filtering**
Keep typing to filter suggestions:
```vb
msg  ' Shows only items starting with "msg"
```

## 🔧 Customization

### Priority System
Snippets appear first in IntelliSense, followed by:
1. Snippets
2. Objects (controls, Me, etc.)
3. Functions
4. Properties/Methods
5. Keywords
6. Variables

### Visual Indicators
- 📄 Snippets (pink icon)
- 🔧 Functions (green icon)
- 📦 Properties (orange icon)
- ⚡ Events (purple icon)
- 🔤 Keywords (blue icon)
- 💾 Variables (cyan icon)

## 📖 Examples

### Example 1: Creating a Function
```vb
' Type: func[Tab]
Private Function FunctionName() As String
    ' Code here
    FunctionName = returnValue
End Function
```

### Example 2: File Reading
```vb
' Type: fread[Tab]
Dim fileNum As Integer
Dim fileContent As String
fileNum = FreeFile

Open "filename.txt" For Input As #fileNum
    fileContent = Input$(LOF(fileNum), fileNum)
Close #fileNum
```

### Example 3: Database Connection
```vb
' Type: adoconn[Tab]
Dim conn As ADODB.Connection
Set conn = New ADODB.Connection

conn.ConnectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=database.mdb"
conn.Open

' Database operations

conn.Close
Set conn = Nothing
```

## 🚦 Troubleshooting

### IntelliSense not appearing?
1. Press **Ctrl+Space** to trigger manually
2. Check if you're in a comment (IntelliSense disabled in comments)
3. Ensure the code editor has focus

### Snippets not working?
1. Type the exact prefix
2. IntelliSense must be active
3. Select the snippet from the list
4. Press Tab or Enter (not Space)

### Wrong suggestions?
1. IntelliSense is context-aware
2. After a dot (.), it shows object members
3. After "As", it shows types
4. Use more specific prefixes

## 🎉 Benefits

1. **Faster Coding**: Write code 3-5x faster
2. **Fewer Errors**: Correct syntax automatically
3. **Learning Tool**: See proper VB6 patterns
4. **Consistency**: Use standard code structures
5. **Productivity**: Focus on logic, not syntax

---

The snippet system and enhanced IntelliSense make VB6 development more efficient and enjoyable. Start using snippets today to boost your productivity!