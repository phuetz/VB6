/**
 * VB6 Real Program Tests - Phase 3.1
 *
 * Tests avec de vrais programmes VB6 complets
 * Validation que le compilateur peut traiter des applications réelles
 *
 * Author: Claude Code
 * Date: 2025-10-05
 * Phase: 3.1 - Suite de tests complète
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

describe('VB6 Real Program Tests', () => {
  let compiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    compiler = new VB6UnifiedASTTranspiler({
      enableOptimizations: true,
      generateSourceMaps: true,
    });
  });

  // ========================================================================
  // Complete Application: Address Book
  // ========================================================================

  describe('Address Book Application', () => {
    const addressBookCode = `
Option Explicit

Type Contact
    ID As Long
    FirstName As String
    LastName As String
    Email As String
    Phone As String
End Type

Private contacts(100) As Contact
Private contactCount As Long

Public Sub Initialize()
    contactCount = 0
End Sub

Public Function AddContact(firstName As String, lastName As String, email As String, phone As String) As Long
    If contactCount >= 100 Then
        AddContact = -1
        Exit Function
    End If

    With contacts(contactCount)
        .ID = contactCount + 1
        .FirstName = firstName
        .LastName = lastName
        .Email = email
        .Phone = phone
    End With

    contactCount = contactCount + 1
    AddContact = contactCount
End Function

Public Function FindContactByEmail(email As String) As Long
    Dim i As Long

    For i = 0 To contactCount - 1
        If contacts(i).Email = email Then
            FindContactByEmail = i
            Exit Function
        End If
    Next i

    FindContactByEmail = -1
End Function

Public Sub DeleteContact(index As Long)
    Dim i As Long

    If index < 0 Or index >= contactCount Then
        Exit Sub
    End If

    For i = index To contactCount - 2
        contacts(i) = contacts(i + 1)
    Next i

    contactCount = contactCount - 1
End Sub

Public Function GetContactCount() As Long
    GetContactCount = contactCount
End Function

Public Function GetContact(index As Long) As Contact
    If index >= 0 And index < contactCount Then
        GetContact = contacts(index)
    End If
End Function
`;

    it('should compile address book application', () => {
      const result = compiler.transpile(addressBookCode, 'AddressBook');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.metrics.procedures).toBeGreaterThan(0);
    });

    it('should have proper structure', () => {
      const result = compiler.transpile(addressBookCode, 'AddressBook');

      expect(result.javascript).toContain('"use strict"');
      expect(result.javascript).toContain('VB6Runtime');
    });
  });

  // ========================================================================
  // Complete Application: Banking System
  // ========================================================================

  describe('Banking System Application', () => {
    const bankingCode = `
Option Explicit

Type Account
    AccountNumber As Long
    OwnerName As String
    Balance As Currency
    IsActive As Boolean
End Type

Private accounts(50) As Account
Private accountCount As Long
Private nextAccountNumber As Long

Public Sub Initialize()
    accountCount = 0
    nextAccountNumber = 1000
End Sub

Public Function CreateAccount(ownerName As String, initialDeposit As Currency) As Long
    If accountCount >= 50 Then
        CreateAccount = -1
        Exit Function
    End If

    If initialDeposit < 0 Then
        CreateAccount = -2
        Exit Function
    End If

    With accounts(accountCount)
        .AccountNumber = nextAccountNumber
        .OwnerName = ownerName
        .Balance = initialDeposit
        .IsActive = True
    End With

    CreateAccount = nextAccountNumber
    nextAccountNumber = nextAccountNumber + 1
    accountCount = accountCount + 1
End Function

Private Function FindAccountIndex(accountNumber As Long) As Long
    Dim i As Long

    For i = 0 To accountCount - 1
        If accounts(i).AccountNumber = accountNumber Then
            FindAccountIndex = i
            Exit Function
        End If
    Next i

    FindAccountIndex = -1
End Function

Public Function Deposit(accountNumber As Long, amount As Currency) As Boolean
    Dim index As Long

    If amount <= 0 Then
        Deposit = False
        Exit Function
    End If

    index = FindAccountIndex(accountNumber)

    If index = -1 Then
        Deposit = False
        Exit Function
    End If

    If Not accounts(index).IsActive Then
        Deposit = False
        Exit Function
    End If

    accounts(index).Balance = accounts(index).Balance + amount
    Deposit = True
End Function

Public Function Withdraw(accountNumber As Long, amount As Currency) As Boolean
    Dim index As Long

    If amount <= 0 Then
        Withdraw = False
        Exit Function
    End If

    index = FindAccountIndex(accountNumber)

    If index = -1 Then
        Withdraw = False
        Exit Function
    End If

    If Not accounts(index).IsActive Then
        Withdraw = False
        Exit Function
    End If

    If accounts(index).Balance < amount Then
        Withdraw = False
        Exit Function
    End If

    accounts(index).Balance = accounts(index).Balance - amount
    Withdraw = True
End Function

Public Function GetBalance(accountNumber As Long) As Currency
    Dim index As Long

    index = FindAccountIndex(accountNumber)

    If index = -1 Then
        GetBalance = 0
        Exit Function
    End If

    GetBalance = accounts(index).Balance
End Function

Public Function Transfer(fromAccount As Long, toAccount As Long, amount As Currency) As Boolean
    If Withdraw(fromAccount, amount) Then
        If Deposit(toAccount, amount) Then
            Transfer = True
        Else
            ' Rollback
            Deposit fromAccount, amount
            Transfer = False
        End If
    Else
        Transfer = False
    End If
End Function
`;

    it('should compile banking system', () => {
      const result = compiler.transpile(bankingCode, 'BankingSystem');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should have all banking functions', () => {
      const result = compiler.transpile(bankingCode, 'BankingSystem');

      expect(result.metrics.procedures).toBeGreaterThan(5);
    });
  });

  // ========================================================================
  // Complete Application: Inventory Management
  // ========================================================================

  describe('Inventory Management Application', () => {
    const inventoryCode = `
Option Explicit

Type Product
    ProductID As Long
    ProductName As String
    Quantity As Long
    Price As Currency
    MinimumStock As Long
End Type

Private products(200) As Product
Private productCount As Long

Public Sub Initialize()
    productCount = 0
End Sub

Public Function AddProduct(productName As String, quantity As Long, price As Currency, minimumStock As Long) As Long
    If productCount >= 200 Then
        AddProduct = -1
        Exit Function
    End If

    If quantity < 0 Or price < 0 Or minimumStock < 0 Then
        AddProduct = -2
        Exit Function
    End If

    With products(productCount)
        .ProductID = productCount + 1
        .ProductName = productName
        .Quantity = quantity
        .Price = price
        .MinimumStock = minimumStock
    End With

    AddProduct = productCount + 1
    productCount = productCount + 1
End Function

Public Function FindProduct(productID As Long) As Long
    Dim i As Long

    For i = 0 To productCount - 1
        If products(i).ProductID = productID Then
            FindProduct = i
            Exit Function
        End If
    Next i

    FindProduct = -1
End Function

Public Function UpdateQuantity(productID As Long, newQuantity As Long) As Boolean
    Dim index As Long

    If newQuantity < 0 Then
        UpdateQuantity = False
        Exit Function
    End If

    index = FindProduct(productID)

    If index = -1 Then
        UpdateQuantity = False
        Exit Function
    End If

    products(index).Quantity = newQuantity
    UpdateQuantity = True
End Function

Public Function GetLowStockProducts() As String
    Dim i As Long
    Dim result As String

    result = ""

    For i = 0 To productCount - 1
        If products(i).Quantity <= products(i).MinimumStock Then
            result = result & products(i).ProductName & " (Stock: " & products(i).Quantity & ")" & vbCrLf
        End If
    Next i

    GetLowStockProducts = result
End Function

Public Function GetTotalInventoryValue() As Currency
    Dim i As Long
    Dim total As Currency

    total = 0

    For i = 0 To productCount - 1
        total = total + (products(i).Quantity * products(i).Price)
    Next i

    GetTotalInventoryValue = total
End Function

Public Function SellProduct(productID As Long, quantitySold As Long) As Boolean
    Dim index As Long

    If quantitySold <= 0 Then
        SellProduct = False
        Exit Function
    End If

    index = FindProduct(productID)

    If index = -1 Then
        SellProduct = False
        Exit Function
    End If

    If products(index).Quantity < quantitySold Then
        SellProduct = False
        Exit Function
    End If

    products(index).Quantity = products(index).Quantity - quantitySold
    SellProduct = True
End Function

Public Sub GenerateInventoryReport()
    Dim i As Long

    Debug.Print "=== INVENTORY REPORT ==="
    Debug.Print "Total Products: " & productCount
    Debug.Print "Total Value: $" & GetTotalInventoryValue()
    Debug.Print ""
    Debug.Print "Low Stock Items:"
    Debug.Print GetLowStockProducts()
End Sub
`;

    it('should compile inventory management system', () => {
      const result = compiler.transpile(inventoryCode, 'InventorySystem');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should have complex business logic', () => {
      const result = compiler.transpile(inventoryCode, 'InventorySystem');

      expect(result.metrics.procedures).toBeGreaterThan(7);
    });
  });

  // ========================================================================
  // Complete Application: Student Grades
  // ========================================================================

  describe('Student Grades Application', () => {
    const gradesCode = `
Option Explicit

Type Student
    StudentID As Long
    FirstName As String
    LastName As String
    Grades(10) As Integer
    GradeCount As Integer
End Type

Private students(50) As Student
Private studentCount As Long

Public Sub Initialize()
    studentCount = 0
End Sub

Public Function AddStudent(firstName As String, lastName As String) As Long
    If studentCount >= 50 Then
        AddStudent = -1
        Exit Function
    End If

    With students(studentCount)
        .StudentID = studentCount + 1
        .FirstName = firstName
        .LastName = lastName
        .GradeCount = 0
    End With

    AddStudent = studentCount + 1
    studentCount = studentCount + 1
End Function

Private Function FindStudentIndex(studentID As Long) As Long
    Dim i As Long

    For i = 0 To studentCount - 1
        If students(i).StudentID = studentID Then
            FindStudentIndex = i
            Exit Function
        End If
    Next i

    FindStudentIndex = -1
End Function

Public Function AddGrade(studentID As Long, grade As Integer) As Boolean
    Dim index As Long

    If grade < 0 Or grade > 100 Then
        AddGrade = False
        Exit Function
    End If

    index = FindStudentIndex(studentID)

    If index = -1 Then
        AddGrade = False
        Exit Function
    End If

    If students(index).GradeCount >= 10 Then
        AddGrade = False
        Exit Function
    End If

    students(index).Grades(students(index).GradeCount) = grade
    students(index).GradeCount = students(index).GradeCount + 1
    AddGrade = True
End Function

Public Function GetAverage(studentID As Long) As Double
    Dim index As Long
    Dim i As Integer
    Dim sum As Long

    index = FindStudentIndex(studentID)

    If index = -1 Then
        GetAverage = 0
        Exit Function
    End If

    If students(index).GradeCount = 0 Then
        GetAverage = 0
        Exit Function
    End If

    sum = 0
    For i = 0 To students(index).GradeCount - 1
        sum = sum + students(index).Grades(i)
    Next i

    GetAverage = CDbl(sum) / CDbl(students(index).GradeCount)
End Function

Public Function GetLetterGrade(studentID As Long) As String
    Dim average As Double

    average = GetAverage(studentID)

    If average >= 90 Then
        GetLetterGrade = "A"
    ElseIf average >= 80 Then
        GetLetterGrade = "B"
    ElseIf average >= 70 Then
        GetLetterGrade = "C"
    ElseIf average >= 60 Then
        GetLetterGrade = "D"
    Else
        GetLetterGrade = "F"
    End If
End Function

Public Function GetClassAverage() As Double
    Dim i As Long
    Dim total As Double
    Dim count As Long

    total = 0
    count = 0

    For i = 0 To studentCount - 1
        If students(i).GradeCount > 0 Then
            total = total + GetAverage(students(i).StudentID)
            count = count + 1
        End If
    Next i

    If count > 0 Then
        GetClassAverage = total / count
    Else
        GetClassAverage = 0
    End If
End Function

Public Sub GenerateGradeReport()
    Dim i As Long

    Debug.Print "=== GRADE REPORT ==="
    Debug.Print "Total Students: " & studentCount
    Debug.Print "Class Average: " & Format(GetClassAverage(), "0.00")
    Debug.Print ""

    For i = 0 To studentCount - 1
        With students(i)
            Debug.Print .FirstName & " " & .LastName & " (" & .StudentID & ")"
            Debug.Print "  Average: " & Format(GetAverage(.StudentID), "0.00")
            Debug.Print "  Letter Grade: " & GetLetterGrade(.StudentID)
            Debug.Print "  Grades Recorded: " & .GradeCount
            Debug.Print ""
        End With
    Next i
End Sub
`;

    it('should compile student grades system', () => {
      const result = compiler.transpile(gradesCode, 'StudentGrades');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should have grade calculation logic', () => {
      const result = compiler.transpile(gradesCode, 'StudentGrades');

      expect(result.metrics.procedures).toBeGreaterThan(5);
    });
  });

  // ========================================================================
  // Complete Application: Text File Parser
  // ========================================================================

  describe('Text File Parser Application', () => {
    const parserCode = `
Option Explicit

Public Function ParseCSVLine(line As String) As Variant
    Dim fields() As String
    Dim fieldCount As Integer
    Dim i As Integer
    Dim inQuotes As Boolean
    Dim currentField As String
    Dim ch As String
    Dim result() As Variant

    fieldCount = 0
    ReDim fields(100)

    inQuotes = False
    currentField = ""

    For i = 1 To Len(line)
        ch = Mid(line, i, 1)

        If ch = """" Then
            inQuotes = Not inQuotes
        ElseIf ch = "," And Not inQuotes Then
            fields(fieldCount) = currentField
            fieldCount = fieldCount + 1
            currentField = ""
        Else
            currentField = currentField & ch
        End If
    Next i

    ' Add last field
    fields(fieldCount) = currentField
    fieldCount = fieldCount + 1

    ' Convert to Variant array
    ReDim result(fieldCount - 1)
    For i = 0 To fieldCount - 1
        result(i) = fields(i)
    Next i

    ParseCSVLine = result
End Function

Public Function CountWords(text As String) As Long
    Dim wordCount As Long
    Dim inWord As Boolean
    Dim i As Long
    Dim ch As String

    wordCount = 0
    inWord = False

    For i = 1 To Len(text)
        ch = Mid(text, i, 1)

        If ch = " " Or ch = vbTab Or ch = vbCr Or ch = vbLf Then
            inWord = False
        Else
            If Not inWord Then
                wordCount = wordCount + 1
                inWord = True
            End If
        End If
    Next i

    CountWords = wordCount
End Function

Public Function ExtractWords(text As String) As Variant
    Dim words() As String
    Dim wordCount As Integer
    Dim currentWord As String
    Dim i As Long
    Dim ch As String
    Dim result() As Variant

    wordCount = 0
    ReDim words(100)
    currentWord = ""

    For i = 1 To Len(text)
        ch = Mid(text, i, 1)

        If ch = " " Or ch = vbTab Or ch = vbCr Or ch = vbLf Then
            If currentWord <> "" Then
                words(wordCount) = currentWord
                wordCount = wordCount + 1
                currentWord = ""
            End If
        Else
            currentWord = currentWord & ch
        End If
    Next i

    ' Add last word
    If currentWord <> "" Then
        words(wordCount) = currentWord
        wordCount = wordCount + 1
    End If

    ' Convert to Variant array
    ReDim result(wordCount - 1)
    For i = 0 To wordCount - 1
        result(i) = words(i)
    Next i

    ExtractWords = result
End Function

Public Function ReplaceAll(text As String, findStr As String, replaceStr As String) As String
    Dim result As String
    Dim pos As Long

    result = text

    Do
        pos = InStr(result, findStr)
        If pos = 0 Then Exit Do

        result = Left(result, pos - 1) & replaceStr & Mid(result, pos + Len(findStr))
    Loop

    ReplaceAll = result
End Function
`;

    it('should compile text parser utilities', () => {
      const result = compiler.transpile(parserCode, 'TextParser');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should have string manipulation functions', () => {
      const result = compiler.transpile(parserCode, 'TextParser');

      expect(result.metrics.procedures).toBeGreaterThan(3);
    });
  });

  // ========================================================================
  // Performance with Real Programs
  // ========================================================================

  describe('Real Program Performance', () => {
    it('should compile address book in reasonable time', () => {
      const addressBookCode = `
Type Contact
    ID As Long
    FirstName As String
    LastName As String
End Type

Private contacts(100) As Contact
Private contactCount As Long

Public Function AddContact(firstName As String, lastName As String) As Long
    AddContact = contactCount + 1
    contactCount = contactCount + 1
End Function
`;

      const start = performance.now();
      const result = compiler.transpile(addressBookCode);
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(200); // < 200ms
    });

    it('should handle large program efficiently', () => {
      // Generate a large program with many procedures
      let largeCode = 'Option Explicit\n\n';

      for (let i = 1; i <= 50; i++) {
        largeCode += `
Public Function Function${i}(x As Integer) As Integer
    Function${i} = x * ${i}
End Function
`;
      }

      const start = performance.now();
      const result = compiler.transpile(largeCode);
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(result.metrics.procedures).toBe(50);
      expect(duration).toBeLessThan(1000); // < 1 second
    });
  });
});
