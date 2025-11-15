# Phase 4: Language Features Examples

This directory contains working VB6 code examples demonstrating all Phase 4 language features.

## Examples Included

### 1. SelectCaseDemo.vb

Demonstrates all Select Case variations:

- **Case Is** - Comparison operators (>=, <=, <, >, =, <>)
- **Case To** - Range checking (Case 10 To 20)
- **Case multiple values** - Multiple discrete values (Case 1, 2, 3)
- **Case Else** - Default case
- **Mixed conditions** - Combining all variations

**Usage:**
Load in VB6 IDE and run. The form will display examples of each Select Case variation with different scoring and categorization scenarios.

---

### 2. ReDimDemo.vb

Demonstrates dynamic array management:

- **Basic ReDim** - Initialize arrays dynamically
- **ReDim Preserve** - Resize arrays without losing data
- **Multi-dimensional arrays** - 2D array creation and manipulation
- **Dynamic growth** - Interactive array expansion

**Usage:**
Load and run. Click "Add Item" button to see dynamic array growth with ReDim Preserve in action.

---

### 3. ParametersDemo.vb

Demonstrates advanced parameter features:

- **Optional parameters** - Functions with default values
- **ByRef parameters** - Pass by reference (changes affect original)
- **ByVal parameters** - Pass by value (changes don't affect original)
- **ParamArray** - Variable number of arguments

**Usage:**
Load and run to see parameter examples. Click "Swap" button to see ByRef in action.

**Key Examples:**

```vb
' Optional with defaults
Function FormatCurrency(amount, Optional symbol = "$", Optional decimals = 2)

' ByRef vs ByVal
Sub Increment(ByRef value)  ' Changes original
Sub Increment(ByVal value)  ' Doesn't change original

' Variable arguments
Function Sum(ParamArray values())
```

---

### 4. ExitAndGotoDemo.vb

Demonstrates control flow exit and jump statements:

- **Exit Function** - Early return from functions
- **Exit Sub** - Early return from subroutines
- **Exit For** - Break out of For loops
- **Exit Do** - Break out of Do loops
- **GoTo with labels** - Jump to labeled sections
- **Error handling with GoTo** - On Error GoTo ErrorHandler

**Usage:**
Load and run. Click "Process File" to see error handling with GoTo in action.

**Key Patterns:**

```vb
' Early exit
Function Find(target) As Integer
    For i = 0 To 100
        If arr(i) = target Then
            Find = i
            Exit Function  ' Found it!
        End If
    Next i
End Function

' Error handling
Sub ProcessFile()
    On Error GoTo ErrorHandler
    ' ... code ...
    Exit Sub
ErrorHandler:
    Print "Error: " & Err.Description
End Sub
```

---

## Feature Coverage

All Phase 4 language features are demonstrated:

- ✅ Select Case (all variations)
- ✅ ReDim and ReDim Preserve
- ✅ Optional parameters
- ✅ ByRef and ByVal
- ✅ ParamArray
- ✅ Exit Function/Sub/For/Do
- ✅ GoTo and labels
- ✅ On Error GoTo
- ✅ Line continuation (used throughout)

## Running the Examples

1. Open VB6 IDE Clone
2. File → Open Project
3. Select any .vb file from this directory
4. Press F5 to run
5. Observe the output in the form or immediate window

## Learning Path

Recommended order to explore these examples:

1. **Start with SelectCaseDemo.vb** - Learn powerful switch-like syntax
2. **Then ParametersDemo.vb** - Understand function parameters
3. **Next ReDimDemo.vb** - Master dynamic arrays
4. **Finally ExitAndGotoDemo.vb** - Control flow patterns

## Notes

- All examples include extensive comments
- Each demo prints output to the form or debug window
- Examples are self-contained and can run independently
- Code follows VB6 best practices

## Additional Resources

See `/VB6_PHASE4_IMPROVEMENTS.md` in the project root for complete technical documentation of all Phase 4 enhancements.
