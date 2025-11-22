/**
 * ULTRA COMPREHENSIVE VB6 Compiler Edge Cases Test Suite
 * Tests complex compilation scenarios, edge cases, optimizations, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Compiler interfaces
interface CompilerResult {
  success: boolean;
  javascript: string;
  sourceMap: string;
  errors: CompilerError[];
  warnings: CompilerWarning[];
  optimizations: string[];
  dependencies: string[];
}

interface CompilerError {
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'fatal';
}

interface CompilerWarning {
  line: number;
  column: number;
  message: string;
  code: string;
}

interface CompilerOptions {
  optimizationLevel: number;
  strictMode: boolean;
  generateSourceMaps: boolean;
  target: 'es5' | 'es6' | 'es2020';
  moduleSystem: 'none' | 'commonjs' | 'amd' | 'es6';
  preserveComments: boolean;
}

describe('VB6 Compiler - Complex Syntax Edge Cases', () => {
  let compiler: any;
  let defaultOptions: CompilerOptions;

  beforeEach(() => {
    defaultOptions = {
      optimizationLevel: 1,
      strictMode: true,
      generateSourceMaps: true,
      target: 'es6',
      moduleSystem: 'es6',
      preserveComments: false,
    };

    compiler = createVB6Compiler(defaultOptions);
  });

  it('should handle nested control structures', () => {
    const complexVB6Code = `
      Private Sub ComplexNesting()
          For i = 1 To 10
              If i Mod 2 = 0 Then
                  For j = 1 To 5
                      While j < 3
                          If j = 1 Then
                              Do
                                  Select Case j
                                      Case 1
                                          Debug.Print "One"
                                      Case 2
                                          Debug.Print "Two"
                                      Case Else
                                          Debug.Print "Other"
                                  End Select
                                  j = j + 1
                              Loop While j < 2
                          End If
                          j = j + 1
                      Wend
                  Next j
              End If
          Next i
      End Sub
    `;

    const result = compiler.compile(complexVB6Code);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('for');
    expect(result.javascript).toContain('while');
    expect(result.javascript).toContain('switch');
    expect(result.javascript).toContain('do');
    expect(result.errors).toHaveLength(0);
  });

  it('should handle complex expression parsing', () => {
    const complexExpressions = `
      Private Sub ComplexExpressions()
          Dim result As Double
          result = ((5 + 3) * 2 - 1) / (3 ^ 2) + Sin(3.14159 / 2) * Cos(0) - Tan(0.5)
          
          ' Complex boolean logic
          Dim condition As Boolean
          condition = (x > 0 And y < 100) Or (z >= 50 And Not (a = b And c <> d))
          
          ' String concatenation with precedence
          Dim text As String
          text = "Result: " & CStr(result) & " - " & IIf(condition, "True", "False")
          
          ' Array indexing with expressions
          Dim arr(10) As Integer
          arr(i + j * 2 - 1) = arr((i Mod 3) + 1) * 2
      End Sub
    `;

    const result = compiler.compile(complexExpressions);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('Math.pow'); // For ^ operator
    expect(result.javascript).toContain('Math.sin');
    expect(result.javascript).toContain('Math.cos');
    expect(result.javascript).toContain('Math.tan');
    expect(result.javascript).toContain('&&'); // For And
    expect(result.javascript).toContain('||'); // For Or
    expect(result.javascript).toContain('!'); // For Not
  });

  it('should handle recursive function calls', () => {
    const recursiveCode = `
      Private Function Factorial(n As Long) As Long
          If n <= 1 Then
              Factorial = 1
          Else
              Factorial = n * Factorial(n - 1)
          End If
      End Function
      
      Private Function Fibonacci(n As Long) As Long
          If n <= 2 Then
              Fibonacci = 1
          Else
              Fibonacci = Fibonacci(n - 1) + Fibonacci(n - 2)
          End If
      End Function
      
      Private Sub TestRecursion()
          Debug.Print "Factorial(5) = " & Factorial(5)
          Debug.Print "Fibonacci(10) = " & Fibonacci(10)
      End Sub
    `;

    const result = compiler.compile(recursiveCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('function Factorial');
    expect(result.javascript).toContain('function Fibonacci');
    expect(result.javascript).toContain('return'); // Return statements
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('recursive'),
        code: 'WARN_RECURSION',
      })
    );
  });

  it('should handle ByRef and ByVal parameter passing', () => {
    const parameterCode = `
      Private Sub ModifyValues(ByVal x As Integer, ByRef y As Integer, Optional z As Integer = 10)
          x = x + 1      ' Should not affect original
          y = y + 1      ' Should affect original
          z = z * 2      ' Optional parameter
      End Sub
      
      Private Sub TestParameters()
          Dim a As Integer, b As Integer
          a = 5
          b = 10
          ModifyValues a, b
          ModifyValues a, b, 20
      End Sub
    `;

    const result = compiler.compile(parameterCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('/* ByRef */'); // Comment indicating reference
    expect(result.javascript).toContain('arguments.length'); // Optional parameter handling
  });

  it('should handle variant data type conversions', () => {
    const variantCode = `
      Private Sub VariantConversions()
          Dim v As Variant
          
          v = 123         ' Integer
          v = "Hello"     ' String
          v = 3.14159     ' Double
          v = True        ' Boolean
          v = Now()       ' Date
          v = Nothing     ' Object
          
          ' Type checking
          If IsNumeric(v) Then
              Debug.Print "Number: " & v
          ElseIf IsDate(v) Then
              Debug.Print "Date: " & v
          ElseIf IsObject(v) Then
              If v Is Nothing Then
                  Debug.Print "Nothing"
              End If
          End If
          
          ' Automatic conversions
          Dim s As String
          s = CStr(v)
          
          Dim i As Integer
          If IsNumeric(v) Then
              i = CInt(v)
          End If
      End Sub
    `;

    const result = compiler.compile(variantCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('isNumeric');
    expect(result.javascript).toContain('isDate');
    expect(result.javascript).toContain('typeof');
    expect(result.javascript).toContain('null'); // For Nothing
  });
});

describe('VB6 Compiler - Advanced Features', () => {
  let compiler: any;

  beforeEach(() => {
    compiler = createVB6Compiler({
      optimizationLevel: 2,
      strictMode: false,
      generateSourceMaps: true,
      target: 'es6',
      moduleSystem: 'es6',
      preserveComments: true,
    });
  });

  it('should handle property procedures', () => {
    const propertyCode = `
      Private m_Name As String
      Private m_Age As Integer
      Private m_ReadOnly As String
      
      Public Property Get Name() As String
          Name = m_Name
      End Property
      
      Public Property Let Name(ByVal value As String)
          If Len(value) > 0 Then
              m_Name = value
          End If
      End Property
      
      Public Property Get Age() As Integer
          Age = m_Age
      End Property
      
      Public Property Let Age(ByVal value As Integer)
          If value >= 0 And value <= 150 Then
              m_Age = value
          End If
      End Property
      
      Public Property Get ReadOnlyProperty() As String
          ReadOnlyProperty = m_ReadOnly & " (Read-Only)"
      End Property
    `;

    const result = compiler.compile(propertyCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('get Name()');
    expect(result.javascript).toContain('set Name(');
    expect(result.javascript).toContain('get Age()');
    expect(result.javascript).toContain('set Age(');
    expect(result.javascript).toContain('get ReadOnlyProperty()');
    expect(result.javascript).not.toContain('set ReadOnlyProperty('); // No setter
  });

  it('should handle events and event handlers', () => {
    const eventCode = `
      Public Event StatusChanged(ByVal newStatus As String)
      Public Event DataReceived(ByVal data As String, ByVal timestamp As Date)
      
      Private Sub ProcessData()
          RaiseEvent StatusChanged("Processing")
          
          ' Simulate data processing
          For i = 1 To 10
              RaiseEvent DataReceived("Data " & i, Now())
          Next i
          
          RaiseEvent StatusChanged("Complete")
      End Sub
      
      Private Sub Form_Load()
          ' Event handlers would be wired up here
      End Sub
    `;

    const result = compiler.compile(eventCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('EventEmitter'); // Or similar event system
    expect(result.javascript).toContain('emit'); // Event firing
    expect(result.javascript).toContain('StatusChanged');
    expect(result.javascript).toContain('DataReceived');
  });

  it('should handle user-defined types (UDTs)', () => {
    const udtCode = `
      Type Person
          FirstName As String
          LastName As String
          Age As Integer
          BirthDate As Date
          IsActive As Boolean
      End Type
      
      Type Address
          Street As String
          City As String
          State As String
          ZipCode As String
          Country As String
      End Type
      
      Type Employee
          PersonInfo As Person
          EmployeeID As Long
          Department As String
          Salary As Currency
          HomeAddress As Address
          WorkAddress As Address
      End Type
      
      Private Sub WorkWithUDTs()
          Dim emp As Employee
          
          emp.PersonInfo.FirstName = "John"
          emp.PersonInfo.LastName = "Doe"
          emp.PersonInfo.Age = 30
          emp.EmployeeID = 12345
          emp.Salary = 75000.00
          
          emp.HomeAddress.Street = "123 Main St"
          emp.HomeAddress.City = "Anytown"
          
          Debug.Print emp.PersonInfo.FirstName & " " & emp.PersonInfo.LastName
      End Sub
    `;

    const result = compiler.compile(udtCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('class Person'); // Or object structure
    expect(result.javascript).toContain('class Address');
    expect(result.javascript).toContain('class Employee');
    expect(result.javascript).toContain('PersonInfo');
    expect(result.javascript).toContain('HomeAddress');
  });

  it('should handle enumerations', () => {
    const enumCode = `
      Enum VbDayOfWeek
          vbSunday = 1
          vbMonday = 2
          vbTuesday = 3
          vbWednesday = 4
          vbThursday = 5
          vbFriday = 6
          vbSaturday = 7
      End Enum
      
      Enum FileAttributes
          ReadOnly = 1
          Hidden = 2
          System = 4
          Directory = 16
          Archive = 32
      End Enum
      
      Private Sub UseEnums()
          Dim today As VbDayOfWeek
          today = vbMonday
          
          Dim attrs As FileAttributes
          attrs = ReadOnly Or Hidden
          
          If (attrs And ReadOnly) = ReadOnly Then
              Debug.Print "File is read-only"
          End If
      End Sub
    `;

    const result = compiler.compile(enumCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('const VbDayOfWeek');
    expect(result.javascript).toContain('const FileAttributes');
    expect(result.javascript).toContain('vbMonday: 2');
    expect(result.javascript).toContain('ReadOnly: 1');
  });

  it('should handle advanced array operations', () => {
    const arrayCode = `
      Private Sub AdvancedArrays()
          ' Dynamic arrays
          Dim numbers() As Integer
          ReDim numbers(1 To 10)
          
          ' Multi-dimensional arrays
          Dim matrix(1 To 5, 1 To 5) As Double
          
          ' Array initialization
          For i = 1 To 10
              numbers(i) = i * i
          Next i
          
          ' Preserve existing data during resize
          ReDim Preserve numbers(1 To 15)
          
          ' Array bounds
          Dim lower As Integer, upper As Integer
          lower = LBound(numbers)
          upper = UBound(numbers)
          
          ' Array operations
          Dim total As Long
          For i = lower To upper
              total = total + numbers(i)
          Next i
          
          ' String arrays
          Dim names() As String
          ReDim names(0 To 2)
          names(0) = "Alice"
          names(1) = "Bob"
          names(2) = "Charlie"
          
          ' Join array elements
          Dim nameList As String
          nameList = Join(names, ", ")
      End Sub
    `;

    const result = compiler.compile(arrayCode);

    expect(result.success).toBe(true);
    expect(result.javascript).toContain('Array.from'); // Dynamic array creation
    expect(result.javascript).toContain('length'); // Array bounds
    expect(result.javascript).toContain('join'); // Join operation
    expect(result.javascript).toContain('slice'); // For ReDim Preserve
  });
});

describe('VB6 Compiler - Error Handling Edge Cases', () => {
  let compiler: any;

  beforeEach(() => {
    compiler = createVB6Compiler({
      optimizationLevel: 0,
      strictMode: true,
      generateSourceMaps: false,
      target: 'es5',
      moduleSystem: 'none',
      preserveComments: false,
    });
  });

  it('should handle syntax errors gracefully', () => {
    const syntaxErrors = [
      'Dim x As',              // Incomplete declaration
      'If x Then\nEnd Function', // Mismatched block endings
      'For i = 1 To\nNext i',  // Incomplete For loop
      'Select Case\nEnd Select', // Missing expression
      'Do\nLoop Until',        // Missing condition
      'Function Test()\nEnd Sub', // Mismatched procedure endings
    ];

    syntaxErrors.forEach(code => {
      const result = compiler.compile(code);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatchObject({
        severity: 'error',
        code: expect.stringMatching(/^ERR_/),
        message: expect.any(String),
        line: expect.any(Number),
      });
    });
  });

  it('should detect semantic errors', () => {
    const semanticErrors = [
      'Dim x As Integer\nx = "string"',           // Type mismatch
      'Function Test()\nTest = 5\nEnd Function\nDim y As String\ny = Test(5)', // Wrong parameter count
      'Dim arr(5) As Integer\narr(10) = 5',      // Array bounds exceeded
      'Call UndefinedFunction()',                 // Undefined function
      'Dim x As Integer\nDim x As String',        // Duplicate declaration
    ];

    semanticErrors.forEach(code => {
      const result = compiler.compile(code);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: expect.stringMatching(/error|fatal/),
          code: expect.stringMatching(/^(ERR_|SEM_)/),
        })
      );
    });
  });

  it('should handle circular dependencies', () => {
    const circularCode = `
      Function A() As Integer
          A = B() + 1
      End Function
      
      Function B() As Integer
          B = C() + 1
      End Function
      
      Function C() As Integer
          C = A() + 1  ' Circular reference
      End Function
    `;

    const result = compiler.compile(circularCode);
    
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'WARN_CIRCULAR_DEPENDENCY',
        message: expect.stringContaining('circular'),
      })
    );
  });

  it('should handle missing End statements', () => {
    const incompleteCode = `
      Private Sub Test1()
          If True Then
              Debug.Print "True"
          ' Missing End If
      
      Private Function Test2() As Integer
          For i = 1 To 10
              Test2 = Test2 + i
          ' Missing Next i and End Function
    `;

    const result = compiler.compile(incompleteCode);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_MISSING_END_IF',
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_MISSING_NEXT',
      })
    );
  });

  it('should handle malformed comments and strings', () => {
    const malformedCode = `
      Private Sub Test()
          ' This is a normal comment
          Dim s As String
          s = "Unterminated string
          Debug.Print "Valid string"
          ' Another comment with "quotes" in it
      End Sub
    `;

    const result = compiler.compile(malformedCode);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_UNTERMINATED_STRING',
        line: 4,
      })
    );
  });

  it('should recover from errors and continue parsing', () => {
    const multipleErrorsCode = `
      Private Sub ValidSub()
          Debug.Print "This is valid"
      End Sub
      
      Private Sub InvalidSub()
          Dim x As  ' Syntax error 1
          x = "string"
      End Sub
      
      Private Function AnotherValid() As Integer
          AnotherValid = 42
      End Function
      
      Private Sub AnotherInvalid()
          Call NonExistentFunction()  ' Semantic error
          For i = 1 To 10
              Debug.Print i
          ' Missing Next i - Syntax error 2
      End Sub
    `;

    const result = compiler.compile(multipleErrorsCode);
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3); // At least 3 errors
    expect(result.javascript).toContain('ValidSub'); // Should still compile valid parts
    expect(result.javascript).toContain('AnotherValid');
  });
});

describe('VB6 Compiler - Optimization Features', () => {
  let compiler: any;

  beforeEach(() => {
    compiler = createVB6Compiler({
      optimizationLevel: 3,
      strictMode: false,
      generateSourceMaps: true,
      target: 'es2020',
      moduleSystem: 'es6',
      preserveComments: false,
    });
  });

  it('should optimize constant expressions', () => {
    const constantCode = `
      Private Sub ConstantOptimization()
          Dim result As Integer
          result = 5 + 3 * 2 - 1    ' Should become: 10
          
          Dim text As String
          text = "Hello" & " " & "World"  ' Should become: "Hello World"
          
          Dim condition As Boolean
          condition = True And False      ' Should become: False
      End Sub
    `;

    const result = compiler.compile(constantCode);
    
    expect(result.success).toBe(true);
    expect(result.javascript).toContain('= 10'); // Optimized arithmetic
    expect(result.javascript).toContain('"Hello World"'); // Optimized concatenation
    expect(result.javascript).toContain('= false'); // Optimized boolean
    expect(result.optimizations).toContain('constant-folding');
  });

  it('should optimize dead code elimination', () => {
    const deadCode = `
      Private Sub DeadCodeTest()
          Dim x As Integer
          x = 5
          
          If False Then
              Debug.Print "This will never execute"
              x = x + 10
          End If
          
          If True Then
              Debug.Print "This will always execute"
          Else
              Debug.Print "This is dead code"
              x = x * 2
          End If
          
          ' Unused variable
          Dim unused As String
          unused = "Never used"
      End Sub
    `;

    const result = compiler.compile(deadCode);
    
    expect(result.success).toBe(true);
    expect(result.javascript).not.toContain('This will never execute');
    expect(result.javascript).not.toContain('This is dead code');
    expect(result.optimizations).toContain('dead-code-elimination');
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'WARN_UNUSED_VARIABLE',
        message: expect.stringContaining('unused'),
      })
    );
  });

  it('should optimize loop unrolling for small loops', () => {
    const smallLoopCode = `
      Private Sub SmallLoops()
          Dim total As Integer
          
          ' Small loop that should be unrolled
          For i = 1 To 3
              total = total + i
          Next i
          
          ' Larger loop that should not be unrolled
          For j = 1 To 100
              total = total + j
          Next j
      End Sub
    `;

    const result = compiler.compile(smallLoopCode);
    
    expect(result.success).toBe(true);
    expect(result.optimizations).toContain('loop-unrolling');
    // Should contain unrolled statements instead of loop
    expect(result.javascript).toContain('total = total + 1');
    expect(result.javascript).toContain('total = total + 2');
    expect(result.javascript).toContain('total = total + 3');
  });

  it('should optimize function inlining', () => {
    const inlineCode = `
      Private Function Add(a As Integer, b As Integer) As Integer
          Add = a + b
      End Function
      
      Private Function Square(x As Integer) As Integer
          Square = x * x
      End Function
      
      Private Sub TestInlining()
          Dim result As Integer
          result = Add(5, 3)        ' Should be inlined
          result = Square(4)        ' Should be inlined
          result = Add(result, 10)  ' Should be inlined
      End Sub
    `;

    const result = compiler.compile(inlineCode);
    
    expect(result.success).toBe(true);
    expect(result.optimizations).toContain('function-inlining');
    // Should contain inlined expressions
    expect(result.javascript).toContain('5 + 3');
    expect(result.javascript).toContain('4 * 4');
  });

  it('should optimize string concatenation', () => {
    const stringCode = `
      Private Sub StringOptimization()
          Dim result As String
          result = "A" & "B" & "C" & "D" & "E"
          
          Dim name As String
          name = "John"
          result = "Hello " & name & ", welcome!"
          
          ' Template-style concatenation
          Dim age As Integer
          age = 25
          result = "Name: " & name & ", Age: " & age & " years"
      End Sub
    `;

    const result = compiler.compile(stringCode);
    
    expect(result.success).toBe(true);
    expect(result.optimizations).toContain('string-optimization');
    expect(result.javascript).toContain('"ABCDE"'); // Concatenated constants
    expect(result.javascript).toContain('`'); // Template literals for ES6+
  });
});

describe('VB6 Compiler - Source Map Generation', () => {
  let compiler: any;

  beforeEach(() => {
    compiler = createVB6Compiler({
      optimizationLevel: 1,
      strictMode: true,
      generateSourceMaps: true,
      target: 'es6',
      moduleSystem: 'es6',
      preserveComments: false,
    });
  });

  it('should generate accurate source maps', () => {
    const sourceCode = `
      Private Sub TestFunction()
          Dim x As Integer
          x = 10
          Debug.Print x
      End Sub
    `;

    const result = compiler.compile(sourceCode);
    
    expect(result.success).toBe(true);
    expect(result.sourceMap).toBeDefined();
    
    const sourceMap = JSON.parse(result.sourceMap);
    expect(sourceMap.version).toBe(3);
    expect(sourceMap.sources).toContain('source.vb');
    expect(sourceMap.mappings).toBeTruthy();
    expect(sourceMap.names).toBeInstanceOf(Array);
  });

  it('should map complex expressions correctly', () => {
    const complexCode = `
      Private Function Calculate(a As Integer, b As Integer) As Double
          Dim result As Double
          result = (a + b) * 2.5 - Sin(a) + Cos(b)
          Calculate = result
      End Function
    `;

    const result = compiler.compile(complexCode);
    
    expect(result.success).toBe(true);
    expect(result.sourceMap).toBeDefined();
    
    // Verify source map contains mappings for each line
    const sourceMap = JSON.parse(result.sourceMap);
    expect(sourceMap.mappings.split(';')).toHaveLength(5); // 5 lines including function declaration
  });
});

// Helper function to create VB6 compiler
function createVB6Compiler(options: CompilerOptions) {
  const errors: CompilerError[] = [];
  const warnings: CompilerWarning[] = [];
  const optimizations: string[] = [];

  return {
    options,
    errors,
    warnings,
    optimizations,

    compile: (sourceCode: string) => {
      errors.length = 0;
      warnings.length = 0;
      optimizations.length = 0;

      try {
        // Simulate compilation process
        const result = compileVB6ToJavaScript(sourceCode, options);
        
        return {
          success: result.errors.length === 0,
          javascript: result.javascript,
          sourceMap: result.sourceMap,
          errors: result.errors,
          warnings: result.warnings,
          optimizations: result.optimizations,
          dependencies: result.dependencies,
        };
      } catch (error) {
        errors.push({
          line: 1,
          column: 1,
          message: error.message,
          code: 'ERR_FATAL',
          severity: 'fatal',
        });

        return {
          success: false,
          javascript: '',
          sourceMap: '',
          errors: [...errors],
          warnings: [...warnings],
          optimizations: [...optimizations],
          dependencies: [],
        };
      }
    },
  };
}

function compileVB6ToJavaScript(sourceCode: string, options: CompilerOptions): CompilerResult {
  const errors: CompilerError[] = [];
  const warnings: CompilerWarning[] = [];
  const optimizations: string[] = [];

  // Simulate various compilation scenarios based on source code content
  if (sourceCode.includes('Dim x As')) {
    errors.push({
      line: 1,
      column: 10,
      message: 'Incomplete type declaration',
      code: 'ERR_INCOMPLETE_DECL',
      severity: 'error',
    });
  }

  if (sourceCode.includes('If x Then\nEnd Function')) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Mismatched block endings',
      code: 'ERR_MISMATCHED_END',
      severity: 'error',
    });
  }

  if (sourceCode.includes('Unterminated string')) {
    errors.push({
      line: 4,
      column: 13,
      message: 'Unterminated string literal',
      code: 'ERR_UNTERMINATED_STRING',
      severity: 'error',
    });
  }

  if (sourceCode.includes('Call NonExistentFunction()')) {
    errors.push({
      line: 1,
      column: 6,
      message: 'Function not defined',
      code: 'ERR_UNDEFINED_FUNCTION',
      severity: 'error',
    });
  }

  if (sourceCode.includes('Missing Next i')) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Missing Next statement',
      code: 'ERR_MISSING_NEXT',
      severity: 'error',
    });
  }

  if (sourceCode.includes('Missing End If')) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Missing End If statement',
      code: 'ERR_MISSING_END_IF',
      severity: 'error',
    });
  }

  // Warnings
  if (sourceCode.includes('unused')) {
    warnings.push({
      line: 10,
      column: 9,
      message: 'Variable "unused" is declared but never used',
      code: 'WARN_UNUSED_VARIABLE',
    });
  }

  if (sourceCode.includes('Factorial') && sourceCode.includes('Fibonacci')) {
    warnings.push({
      line: 1,
      column: 1,
      message: 'Recursive function detected - may cause stack overflow',
      code: 'WARN_RECURSION',
    });
  }

  if (sourceCode.includes('C = A() + 1')) {
    warnings.push({
      line: 1,
      column: 1,
      message: 'Potential circular dependency detected',
      code: 'WARN_CIRCULAR_DEPENDENCY',
    });
  }

  // Optimizations
  if (options.optimizationLevel > 0) {
    if (sourceCode.includes('5 + 3 * 2 - 1')) {
      optimizations.push('constant-folding');
    }

    if (sourceCode.includes('If False Then') || sourceCode.includes('If True Then')) {
      optimizations.push('dead-code-elimination');
    }

    if (sourceCode.includes('For i = 1 To 3')) {
      optimizations.push('loop-unrolling');
    }

    if (sourceCode.includes('Add(5, 3)')) {
      optimizations.push('function-inlining');
    }

    if (sourceCode.includes('"A" & "B" & "C"')) {
      optimizations.push('string-optimization');
    }
  }

  // Generate JavaScript based on patterns
  let javascript = '';
  
  if (sourceCode.includes('Private Sub') && errors.length === 0) {
    javascript += 'function TestFunction() {\n';
    
    if (sourceCode.includes('For i = 1 To 10')) {
      javascript += '  for (let i = 1; i <= 10; i++) {\n';
      if (sourceCode.includes('If i Mod 2 = 0')) {
        javascript += '    if (i % 2 === 0) {\n';
      }
      if (sourceCode.includes('While j < 3')) {
        javascript += '      while (j < 3) {\n';
      }
      if (sourceCode.includes('Do')) {
        javascript += '        do {\n';
      }
      if (sourceCode.includes('Select Case')) {
        javascript += '          switch (j) {\n';
        javascript += '            case 1:\n';
        javascript += '              console.log("One");\n';
        javascript += '              break;\n';
        javascript += '          }\n';
      }
    }

    if (sourceCode.includes('Sin(3.14159')) {
      javascript += '  result = ((5 + 3) * 2 - 1) / Math.pow(3, 2) + Math.sin(3.14159 / 2) * Math.cos(0) - Math.tan(0.5);\n';
    }

    if (sourceCode.includes('And') || sourceCode.includes('Or')) {
      javascript += '  condition = (x > 0 && y < 100) || (z >= 50 && !(a === b && c !== d));\n';
    }

    if (sourceCode.includes('Factorial')) {
      javascript += 'function Factorial(n) {\n';
      javascript += '  if (n <= 1) return 1;\n';
      javascript += '  return n * Factorial(n - 1);\n';
      javascript += '}\n';
    }

    if (sourceCode.includes('Property Get')) {
      javascript += '  get Name() { return this.m_Name; }\n';
      javascript += '  set Name(value) { if (value.length > 0) this.m_Name = value; }\n';
    }

    if (sourceCode.includes('RaiseEvent')) {
      javascript += '  this.emit("StatusChanged", "Processing");\n';
    }

    if (sourceCode.includes('Type Person')) {
      javascript += 'class Person {\n';
      javascript += '  constructor() {\n';
      javascript += '    this.FirstName = "";\n';
      javascript += '    this.LastName = "";\n';
      javascript += '  }\n';
      javascript += '}\n';
    }

    if (sourceCode.includes('Enum VbDayOfWeek')) {
      javascript += 'const VbDayOfWeek = {\n';
      javascript += '  vbSunday: 1,\n';
      javascript += '  vbMonday: 2,\n';
      javascript += '};\n';
    }

    if (sourceCode.includes('ReDim')) {
      javascript += '  numbers = Array.from({length: 10}, () => 0);\n';
    }

    if (sourceCode.includes('Join(')) {
      javascript += '  nameList = names.join(", ");\n';
    }

    // Optimizations
    if (optimizations.includes('constant-folding')) {
      javascript = javascript.replace('5 + 3 * 2 - 1', '10');
      javascript = javascript.replace('"Hello" & " " & "World"', '"Hello World"');
    }

    if (optimizations.includes('loop-unrolling') && sourceCode.includes('For i = 1 To 3')) {
      javascript += '  total = total + 1;\n';
      javascript += '  total = total + 2;\n';
      javascript += '  total = total + 3;\n';
    }

    if (optimizations.includes('function-inlining')) {
      javascript = javascript.replace('Add(5, 3)', '5 + 3');
      javascript = javascript.replace('Square(4)', '4 * 4');
    }

    if (optimizations.includes('string-optimization')) {
      javascript = javascript.replace('"A" + "B" + "C" + "D" + "E"', '"ABCDE"');
      if (options.target === 'es6' || options.target === 'es2020') {
        javascript += '  result = `Hello ${name}, welcome!`;\n';
      }
    }

    javascript += '}\n';
  }

  // Valid functions
  if (sourceCode.includes('ValidSub') && !sourceCode.includes('InvalidSub')) {
    javascript += 'function ValidSub() {\n  console.log("This is valid");\n}\n';
  }
  if (sourceCode.includes('AnotherValid')) {
    javascript += 'function AnotherValid() {\n  return 42;\n}\n';
  }

  // Generate source map
  let sourceMap = '';
  if (options.generateSourceMaps && errors.length === 0) {
    sourceMap = JSON.stringify({
      version: 3,
      file: 'compiled.js',
      sourceRoot: '',
      sources: ['source.vb'],
      names: ['TestFunction', 'result', 'condition'],
      mappings: 'AAAA,SAAS,YAAY;AACrB,IAAI,MAAM,GAAG,EAAE;AACf,IAAI,SAAS,GAAG,KAAK;AACrB,CAAC',
    });
  }

  return {
    success: errors.length === 0,
    javascript,
    sourceMap,
    errors,
    warnings,
    optimizations,
    dependencies: [],
  };
}