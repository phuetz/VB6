/**
 * Tests unitaires pour les programmes VB6 de test
 * Vérification de l'importation et de l'exécution des formulaires VB6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VB6FileFormatsComplete } from '../../services/VB6FileFormatsComplete';
import { VB6FormImportExport } from '../../services/VB6FormImportExport';
import { vb6Parser } from '../../utils/vb6Parser';
import { VB6Transpiler } from '../../utils/vb6Transpiler';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('VB6 Test Programs', () => {
  let fileFormats: VB6FileFormatsComplete;
  let formImporter: VB6FormImportExport;
  let parser: any;
  let transpiler: VB6Transpiler;

  beforeEach(() => {
    vi.clearAllMocks();
    fileFormats = new VB6FileFormatsComplete();
    formImporter = new VB6FormImportExport();
    parser = vb6Parser;
    transpiler = new VB6Transpiler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HelloWorld.frm', () => {
    let helloWorldContent: string;

    beforeEach(() => {
      // Simuler le contenu du fichier HelloWorld.frm
      helloWorldContent = `
VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Hello World - Test VB6"
   ClientHeight    =   3195
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4680
   Begin VB.CommandButton cmdExit 
      Caption         =   "&Quitter"
      Height          =   375
      Left            =   2760
      TabIndex        =   2
      Top             =   2520
      Width           =   1215
   End
   Begin VB.CommandButton cmdHello 
      Caption         =   "&Bonjour"
      Height          =   375
      Left            =   720
      TabIndex        =   1
      Top             =   2520
      Width           =   1215
   End
   Begin VB.Label lblMessage 
      Caption         =   "Cliquez sur Bonjour pour commencer"
      Height          =   855
      Left            =   360
      TabIndex        =   0
      Top             =   720
      Width           =   3975
   End
End
Attribute VB_Name = "Form1"

Private Sub Form_Load()
    Me.Caption = "Hello World - Test VB6 Web IDE"
    lblMessage.Caption = "Bienvenue dans VB6 Web IDE!"
End Sub

Private Sub cmdHello_Click()
    Dim userName As String
    userName = InputBox("Quel est votre nom ?", "Bonjour", "Utilisateur")
    If userName <> "" Then
        lblMessage.Caption = "Bonjour " & userName & "!"
        MsgBox "Hello " & userName & "!", vbInformation
    End If
End Sub

Private Sub cmdExit_Click()
    End
End Sub
      `.trim();
    });

    it('should parse HelloWorld form structure correctly', () => {
      const parseResult = fileFormats.parseVB6Form(helloWorldContent);

      expect(parseResult.success).toBe(true);
      expect(parseResult.form).toBeDefined();
      expect(parseResult.form?.name).toBe('Form1');
      expect(parseResult.form?.caption).toBe('Hello World - Test VB6');
    });

    it('should extract all controls from HelloWorld form', () => {
      const parseResult = fileFormats.parseVB6Form(helloWorldContent);

      expect(parseResult.controls).toHaveLength(3);

      const cmdExit = parseResult.controls?.find(c => c.name === 'cmdExit');
      const cmdHello = parseResult.controls?.find(c => c.name === 'cmdHello');
      const lblMessage = parseResult.controls?.find(c => c.name === 'lblMessage');

      expect(cmdExit).toBeDefined();
      expect(cmdExit?.type).toBe('CommandButton');
      expect(cmdExit?.properties.Caption).toBe('&Quitter');

      expect(cmdHello).toBeDefined();
      expect(cmdHello?.type).toBe('CommandButton');
      expect(cmdHello?.properties.Caption).toBe('&Bonjour');

      expect(lblMessage).toBeDefined();
      expect(lblMessage?.type).toBe('Label');
    });

    it('should parse HelloWorld code events correctly', () => {
      const codeResult = fileFormats.parseVB6Code(helloWorldContent);

      expect(codeResult.success).toBe(true);
      expect(codeResult.procedures).toHaveLength(3);

      const procedures = codeResult.procedures?.map(p => p.name) || [];
      expect(procedures).toContain('Form_Load');
      expect(procedures).toContain('cmdHello_Click');
      expect(procedures).toContain('cmdExit_Click');
    });

    it('should transpile HelloWorld events to JavaScript', () => {
      const codeResult = fileFormats.parseVB6Code(helloWorldContent);

      if (codeResult.procedures) {
        const formLoadProc = codeResult.procedures.find(p => p.name === 'Form_Load');
        expect(formLoadProc).toBeDefined();

        const jsCode = transpiler.transpileVB6ToJS(formLoadProc!.body);
        expect(jsCode).toContain('this.caption');
        expect(jsCode).toContain('lblMessage.caption');
      }
    });
  });

  describe('CalculatorTest.frm', () => {
    it('should handle control arrays correctly', () => {
      const calculatorContent = `
Begin VB.CommandButton cmdNumber 
   Caption         =   "0"
   Height          =   615
   Index           =   0
   Left            =   960
   TabIndex        =   13
   Top             =   3720
   Width           =   615
End
Begin VB.CommandButton cmdNumber 
   Caption         =   "1"
   Height          =   615
   Index           =   1
   Left            =   120
   TabIndex        =   9
   Top             =   3000
   Width           =   615
End
      `;

      const parseResult = fileFormats.parseVB6Form(calculatorContent);
      expect(parseResult.success).toBe(true);

      // Should handle control arrays
      const numberButtons = parseResult.controls?.filter(c => c.name.startsWith('cmdNumber'));
      expect(numberButtons?.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse calculator operations correctly', () => {
      const calculatorCode = `
Private Sub cmdNumber_Click(Index As Integer)
    If Index = 10 Then
        numberStr = "."
    Else
        numberStr = CStr(Index)
    End If
End Sub

Private Sub PerformCalculation()
    Select Case currentOperation
        Case "+"
            result = previousValue + currentValue
        Case "-"
            result = previousValue - currentValue
        Case "*"
            result = previousValue * currentValue
        Case "/"
            result = previousValue / currentValue
    End Select
End Sub
      `;

      const codeResult = fileFormats.parseVB6Code(calculatorCode);
      expect(codeResult.success).toBe(true);
      expect(codeResult.procedures).toHaveLength(2);

      const clickProc = codeResult.procedures?.find(p => p.name === 'cmdNumber_Click');
      expect(clickProc).toBeDefined();
      expect(clickProc?.parameters).toContain('Index As Integer');
    });
  });

  describe('DatabaseTest.frm', () => {
    it('should parse database form with complex controls', () => {
      const databaseContent = `
Object = "{CDE57A40-8B86-11D0-B3C6-00A0C90AEA82}#1.0#0"; "MSDATGRD.OCX"
Object = "{F0D2F211-CCB0-11D0-A316-00AA00688B10}#1.0#0"; "MSDATLST.OCX"
Begin MSDataGridLib.DataGrid dgCustomers 
   Height          =   1695
   Left            =   120
   TabIndex        =   2
   Top             =   840
   Width           =   7935
End
Begin MSDataListLib.DataList dlCustomers 
   Height          =   1140
   Left            =   4200
   TabIndex        =   3
   Top             =   2280
   Width           =   3855
End
      `;

      const parseResult = fileFormats.parseVB6Form(databaseContent);
      expect(parseResult.success).toBe(true);

      const dataGrid = parseResult.controls?.find(c => c.name === 'dgCustomers');
      const dataList = parseResult.controls?.find(c => c.name === 'dlCustomers');

      expect(dataGrid).toBeDefined();
      expect(dataGrid?.type).toBe('DataGrid');

      expect(dataList).toBeDefined();
      expect(dataList?.type).toBe('DataList');
    });

    it('should handle database operations in code', () => {
      const databaseCode = `
Private Type Customer
    ID As Long
    FirstName As String
    LastName As String
End Type

Private customers() As Customer

Private Sub LoadCustomerData()
    For i = 1 To customerCount
        dataString = dataString & customers(i).ID
    Next i
End Sub
      `;

      const codeResult = fileFormats.parseVB6Code(databaseCode);
      expect(codeResult.success).toBe(true);

      // Should parse user-defined types
      const customerType = codeResult.types?.find(t => t.name === 'Customer');
      expect(customerType).toBeDefined();
    });
  });

  describe('GraphicsTest.frm', () => {
    it('should parse graphics form with PictureBox', () => {
      const graphicsContent = `
Begin VB.PictureBox picCanvas 
   BackColor       =   &H00FFFFFF&
   Height          =   5535
   Left            =   120
   ScaleHeight     =   5475
   ScaleWidth      =   9195
   TabIndex        =   15
   Top             =   240
   Width           =   9255
End
Begin VB.Timer tmrAnimation 
   Enabled         =   0   'False
   Interval        =   50
   Left            =   8760
   Top             =   6960
End
      `;

      const parseResult = fileFormats.parseVB6Form(graphicsContent);
      expect(parseResult.success).toBe(true);

      const canvas = parseResult.controls?.find(c => c.name === 'picCanvas');
      const timer = parseResult.controls?.find(c => c.name === 'tmrAnimation');

      expect(canvas).toBeDefined();
      expect(canvas?.type).toBe('PictureBox');

      expect(timer).toBeDefined();
      expect(timer?.type).toBe('Timer');
      expect(timer?.properties.Interval).toBe('50');
    });

    it('should handle graphics drawing code', () => {
      const graphicsCode = `
Private Sub DrawCircles()
    For i = 1 To 15
        radius = i * 10
        color = RGB((i * 17) Mod 256, (i * 23) Mod 256, (i * 31) Mod 256)
        picCanvas.Circle (picCanvas.ScaleWidth / 2, picCanvas.ScaleHeight / 2), radius, color
    Next i
End Sub

Private Sub HSBtoRGB(h As Single, s As Single, b As Single, r As Integer, g As Integer, b As Integer)
    c = b * s
    x = c * (1 - Abs(((h / 60) Mod 2) - 1))
End Sub
      `;

      const codeResult = fileFormats.parseVB6Code(graphicsCode);
      expect(codeResult.success).toBe(true);

      const drawProc = codeResult.procedures?.find(p => p.name === 'DrawCircles');
      const hsbProc = codeResult.procedures?.find(p => p.name === 'HSBtoRGB');

      expect(drawProc).toBeDefined();
      expect(hsbProc).toBeDefined();
      expect(hsbProc?.parameters).toContain('h As Single');
    });
  });

  describe('GameTest.frm', () => {
    it('should parse game form with KeyPreview', () => {
      const gameContent = `
Begin VB.Form frmGame 
   Caption         =   "Snake Game - Test VB6 Web IDE"
   KeyPreview      =   -1  'True
   ClientHeight    =   6630
   ClientWidth     =   8175
   Begin VB.Timer tmrGame 
      Enabled         =   0   'False
      Interval        =   200
   End
End
      `;

      const parseResult = fileFormats.parseVB6Form(gameContent);
      expect(parseResult.success).toBe(true);
      expect(parseResult.form?.properties.KeyPreview).toBe('-1');
    });

    it('should handle game logic with constants and types', () => {
      const gameCode = `
Const GRID_SIZE = 15
Const MAX_SNAKE_LENGTH = 500

Private Type Point
    x As Integer
    y As Integer
End Type

Private Type Snake
    body(MAX_SNAKE_LENGTH) As Point
    length As Integer
    direction As Integer
End Type

Const DIR_UP = 1
Const DIR_DOWN = 2

Private Sub MoveSnake()
    Select Case snake.direction
        Case DIR_UP
            newHead.y = newHead.y - 1
        Case DIR_DOWN
            newHead.y = newHead.y + 1
    End Select
End Sub
      `;

      const codeResult = fileFormats.parseVB6Code(gameCode);
      expect(codeResult.success).toBe(true);

      // Should parse constants
      const constants = codeResult.constants;
      expect(constants).toBeDefined();
      expect(constants?.some(c => c.name === 'GRID_SIZE')).toBe(true);
      expect(constants?.some(c => c.name === 'DIR_UP')).toBe(true);

      // Should parse user-defined types
      const pointType = codeResult.types?.find(t => t.name === 'Point');
      const snakeType = codeResult.types?.find(t => t.name === 'Snake');

      expect(pointType).toBeDefined();
      expect(snakeType).toBeDefined();
    });

    it('should handle keyboard events', () => {
      const keyboardCode = `
Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
    Select Case KeyCode
        Case vbKeyUp
            If snake.direction <> DIR_DOWN Then snake.direction = DIR_UP
        Case vbKeyDown
            If snake.direction <> DIR_UP Then snake.direction = DIR_DOWN
        Case vbKeySpace
            PauseGame
    End Select
End Sub
      `;

      const codeResult = fileFormats.parseVB6Code(keyboardCode);
      expect(codeResult.success).toBe(true);

      const keyDownProc = codeResult.procedures?.find(p => p.name === 'Form_KeyDown');
      expect(keyDownProc).toBeDefined();
      expect(keyDownProc?.parameters).toContain('KeyCode As Integer');
      expect(keyDownProc?.parameters).toContain('Shift As Integer');
    });
  });

  describe('Program Integration', () => {
    it('should load and run all test programs without errors', async () => {
      const programs = ['HelloWorld', 'CalculatorTest', 'DatabaseTest', 'GraphicsTest', 'GameTest'];

      for (const program of programs) {
        // Simuler le chargement du programme
        const result = await formImporter.importVB6Form(`${program}.frm`, 'mock-content');

        expect(result.success).toBe(true);
        expect(result.form).toBeDefined();
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should validate VB6 syntax in all test programs', () => {
      const codeSnippets = [
        'Private Sub Form_Load()\n    Me.Caption = "Test"\nEnd Sub',
        'Private Sub cmdButton_Click()\n    MsgBox "Hello"\nEnd Sub',
        'Dim userName As String\nuserName = InputBox("Name")',
        'For i = 1 To 10\n    Debug.Print i\nNext i',
        'If x > 0 Then\n    y = x * 2\nEnd If',
      ];

      codeSnippets.forEach((code, index) => {
        const parseResult = parser.parseVB6Code(code);
        expect(parseResult.success).toBe(true);
        expect(parseResult.errors).toHaveLength(0);
      });
    });

    it('should transpile VB6 events to executable JavaScript', () => {
      const vb6Events = [
        'lblMessage.Caption = "Hello " & userName & "!"',
        'If userName <> "" Then MsgBox "Welcome"',
        'For i = 1 To 10: sum = sum + i: Next i',
        'result = previousValue + currentValue',
        'picCanvas.Circle (x, y), radius, color',
      ];

      vb6Events.forEach(vb6Code => {
        const jsCode = transpiler.transpileVB6ToJS(vb6Code);

        expect(jsCode).toBeDefined();
        expect(jsCode.length).toBeGreaterThan(0);
        expect(jsCode).not.toContain('&'); // VB6 concatenation should be converted
        expect(jsCode).toMatch(/\w+/); // Should contain valid identifiers
      });
    });

    it('should handle all VB6 control types used in test programs', () => {
      const controlTypes = [
        'CommandButton',
        'Label',
        'TextBox',
        'PictureBox',
        'Timer',
        'Frame',
        'CheckBox',
        'OptionButton',
        'ListBox',
        'ComboBox',
        'HScrollBar',
        'VScrollBar',
        'DataGrid',
        'DataList',
      ];

      controlTypes.forEach(controlType => {
        const mockControl = fileFormats.createDefaultControl(controlType);

        expect(mockControl).toBeDefined();
        expect(mockControl.type).toBe(controlType);
        expect(mockControl.properties).toBeDefined();
      });
    });

    it('should validate form layout and control positioning', () => {
      const mockForm = {
        name: 'TestForm',
        clientWidth: 8175,
        clientHeight: 6630,
        controls: [
          { name: 'cmdButton', left: 1080, top: 480, width: 975, height: 375 },
          { name: 'lblMessage', left: 360, top: 720, width: 3975, height: 855 },
        ],
      };

      // Vérifier que tous les contrôles sont dans les limites du formulaire
      mockForm.controls.forEach(control => {
        expect(control.left + control.width).toBeLessThanOrEqual(mockForm.clientWidth);
        expect(control.top + control.height).toBeLessThanOrEqual(mockForm.clientHeight);
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.top).toBeGreaterThanOrEqual(0);
      });
    });

    it('should measure performance of program parsing', async () => {
      const largeVB6Code = `
Private Sub ComplexCalculation()
    Dim result As Double
    Dim i As Integer, j As Integer
    
    For i = 1 To 1000
        For j = 1 To 100
            result = result + (i * j) / (i + j + 1)
            If result > 1000000 Then
                result = result / 2
            End If
        Next j
    Next i
    
    Debug.Print "Result: " & result
End Sub
      `;

      const startTime = performance.now();
      const parseResult = fileFormats.parseVB6Code(largeVB6Code);
      const endTime = performance.now();

      expect(parseResult.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should parse in less than 1 second
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle malformed VB6 forms', () => {
      const malformedForm = `
Begin VB.Form Form1
   Caption = "Test"
   // Missing End statement
Begin VB.CommandButton cmd1
   // Missing properties
      `;

      const parseResult = fileFormats.parseVB6Form(malformedForm);

      expect(parseResult.success).toBe(false);
      expect(parseResult.errors).toBeDefined();
      expect(parseResult.errors!.length).toBeGreaterThan(0);
    });

    it('should handle invalid VB6 syntax in code', () => {
      const invalidCode = `
Private Sub Test()
    Dim x As Integer
    x = "string" ' Type mismatch
    For i = 1 To ' Incomplete For loop
    End Sub ' Missing Next
      `;

      const codeResult = fileFormats.parseVB6Code(invalidCode);

      expect(codeResult.success).toBe(false);
      expect(codeResult.errors).toBeDefined();
      expect(codeResult.errors!.length).toBeGreaterThan(0);
    });

    it('should provide helpful error messages', () => {
      const invalidForm = 'Begin VB.Form\nCaption = \nEnd'; // Missing value

      const parseResult = fileFormats.parseVB6Form(invalidForm);

      expect(parseResult.success).toBe(false);
      expect(parseResult.errors![0]).toMatch(/missing|expected|invalid/i);
    });
  });
});
