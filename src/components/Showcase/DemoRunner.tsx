/**
 * Demo Runner - Automated VB6 IDE Demonstrations
 *
 * This component provides automated demonstrations of VB6 IDE capabilities
 * with realistic scenarios and interactive examples.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { Control } from '../../context/types';

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  steps: DemoStep[];
}

interface DemoStep {
  id: string;
  action: string;
  description: string;
  duration: number;
  data?: any;
}

export const DemoRunner: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    controls,
    addControl,
    updateControl,
    selectedControls,
    setSelectedControls,
    forms,
    currentForm,
  } = useVB6Store();

  const demoScenarios: DemoScenario[] = [
    {
      id: 'calculator-app',
      title: 'Build a Calculator App',
      description: 'Complete demonstration of building a VB6 calculator application',
      category: 'Complete Application',
      duration: 45000,
      steps: [
        {
          id: 'create-form',
          action: 'createForm',
          description: 'Create new form for calculator',
          duration: 2000,
          data: { name: 'Calculator', width: 300, height: 400 },
        },
        {
          id: 'add-display',
          action: 'addControl',
          description: 'Add display textbox',
          duration: 3000,
          data: {
            type: 'TextBox',
            name: 'txtDisplay',
            x: 20,
            y: 20,
            width: 260,
            height: 40,
            text: '0',
            alignment: 1,
            fontSize: 16,
          },
        },
        {
          id: 'add-buttons',
          action: 'addButtons',
          description: 'Add calculator buttons',
          duration: 8000,
          data: {
            buttons: [
              { text: 'C', x: 20, y: 80, name: 'btnClear' },
              { text: '±', x: 90, y: 80, name: 'btnSign' },
              { text: '%', x: 160, y: 80, name: 'btnPercent' },
              { text: '÷', x: 230, y: 80, name: 'btnDivide' },
              { text: '7', x: 20, y: 130, name: 'btn7' },
              { text: '8', x: 90, y: 130, name: 'btn8' },
              { text: '9', x: 160, y: 130, name: 'btn9' },
              { text: '×', x: 230, y: 130, name: 'btnMultiply' },
              { text: '4', x: 20, y: 180, name: 'btn4' },
              { text: '5', x: 90, y: 180, name: 'btn5' },
              { text: '6', x: 160, y: 180, name: 'btn6' },
              { text: '-', x: 230, y: 180, name: 'btnSubtract' },
              { text: '1', x: 20, y: 230, name: 'btn1' },
              { text: '2', x: 90, y: 230, name: 'btn2' },
              { text: '3', x: 160, y: 230, name: 'btn3' },
              { text: '+', x: 230, y: 230, name: 'btnAdd' },
              { text: '0', x: 20, y: 280, name: 'btn0', width: 120 },
              { text: '.', x: 160, y: 280, name: 'btnDecimal' },
              { text: '=', x: 230, y: 280, name: 'btnEquals' },
            ],
          },
        },
        {
          id: 'add-code',
          action: 'addCode',
          description: 'Add calculator logic code',
          duration: 15000,
          data: {
            code: `
Private currentValue As Double
Private previousValue As Double
Private operation As String
Private waitingForInput As Boolean

Private Sub Form_Load()
    currentValue = 0
    previousValue = 0
    operation = ""
    waitingForInput = False
    txtDisplay.Text = "0"
End Sub

Private Sub btn0_Click()
    InputNumber "0"
End Sub

Private Sub btn1_Click()
    InputNumber "1"
End Sub

Private Sub btn2_Click()
    InputNumber "2"
End Sub

' ... (additional button click handlers)

Private Sub InputNumber(digit As String)
    If waitingForInput Or txtDisplay.Text = "0" Then
        txtDisplay.Text = digit
        waitingForInput = False
    Else
        txtDisplay.Text = txtDisplay.Text + digit
    End If
    currentValue = CDbl(txtDisplay.Text)
End Sub

Private Sub btnAdd_Click()
    PerformOperation
    operation = "+"
    previousValue = currentValue
    waitingForInput = True
End Sub

Private Sub btnEquals_Click()
    PerformOperation
    operation = ""
    waitingForInput = True
End Sub

Private Sub PerformOperation()
    Select Case operation
        Case "+"
            currentValue = previousValue + currentValue
        Case "-"
            currentValue = previousValue - currentValue
        Case "*"
            currentValue = previousValue * currentValue
        Case "/"
            If currentValue <> 0 Then
                currentValue = previousValue / currentValue
            Else
                MsgBox "Cannot divide by zero!", vbError
                Exit Sub
            End If
    End Select
    
    txtDisplay.Text = CStr(currentValue)
End Sub
`,
          },
        },
        {
          id: 'test-app',
          action: 'testApplication',
          description: 'Test calculator functionality',
          duration: 10000,
          data: {
            testSequence: ['5', '+', '3', '=', 'C', '1', '0', '*', '2', '='],
          },
        },
        {
          id: 'compile-app',
          action: 'compileApplication',
          description: 'Compile to executable',
          duration: 5000,
          data: { target: 'native', optimization: 'O2' },
        },
      ],
    },
    {
      id: 'data-grid-demo',
      title: 'Database Application',
      description: 'Demonstrate database connectivity and data grid usage',
      category: 'Data Application',
      duration: 30000,
      steps: [
        {
          id: 'create-data-form',
          action: 'createForm',
          description: 'Create data entry form',
          duration: 2000,
          data: { name: 'CustomerData', width: 600, height: 500 },
        },
        {
          id: 'add-data-controls',
          action: 'addDataControls',
          description: 'Add data controls and grid',
          duration: 5000,
          data: {
            controls: [
              { type: 'MSFlexGrid', name: 'grdCustomers', x: 20, y: 20, width: 560, height: 300 },
              { type: 'Label', name: 'lblName', x: 20, y: 340, text: 'Name:' },
              { type: 'TextBox', name: 'txtName', x: 80, y: 340, width: 200 },
              { type: 'Label', name: 'lblEmail', x: 300, y: 340, text: 'Email:' },
              { type: 'TextBox', name: 'txtEmail', x: 360, y: 340, width: 200 },
              { type: 'CommandButton', name: 'btnAdd', x: 20, y: 380, caption: 'Add' },
              { type: 'CommandButton', name: 'btnUpdate', x: 100, y: 380, caption: 'Update' },
              { type: 'CommandButton', name: 'btnDelete', x: 180, y: 380, caption: 'Delete' },
            ],
          },
        },
        {
          id: 'setup-grid',
          action: 'setupDataGrid',
          description: 'Configure data grid columns',
          duration: 3000,
          data: {
            columns: ['ID', 'Name', 'Email', 'Phone', 'City'],
            data: [
              [1, 'John Doe', 'john@email.com', '555-1234', 'New York'],
              [2, 'Jane Smith', 'jane@email.com', '555-5678', 'Los Angeles'],
              [3, 'Bob Johnson', 'bob@email.com', '555-9012', 'Chicago'],
            ],
          },
        },
        {
          id: 'add-data-code',
          action: 'addCode',
          description: 'Add database manipulation code',
          duration: 12000,
          data: {
            code: `
Private customers As Collection

Private Sub Form_Load()
    Set customers = New Collection
    SetupGrid
    LoadSampleData
    RefreshGrid
End Sub

Private Sub SetupGrid()
    With grdCustomers
        .Rows = 1
        .Cols = 5
        .FixedRows = 1
        .TextMatrix(0, 0) = "ID"
        .TextMatrix(0, 1) = "Name"
        .TextMatrix(0, 2) = "Email"
        .TextMatrix(0, 3) = "Phone"
        .TextMatrix(0, 4) = "City"
        
        .ColWidth(0) = 500
        .ColWidth(1) = 1500
        .ColWidth(2) = 2000
        .ColWidth(3) = 1200
        .ColWidth(4) = 1200
    End With
End Sub

Private Sub LoadSampleData()
    AddCustomer 1, "John Doe", "john@email.com", "555-1234", "New York"
    AddCustomer 2, "Jane Smith", "jane@email.com", "555-5678", "Los Angeles"
    AddCustomer 3, "Bob Johnson", "bob@email.com", "555-9012", "Chicago"
End Sub

Private Sub AddCustomer(id As Long, name As String, email As String, phone As String, city As String)
    Dim customer As New Dictionary
    customer("ID") = id
    customer("Name") = name
    customer("Email") = email
    customer("Phone") = phone
    customer("City") = city
    customers.Add customer, CStr(id)
End Sub

Private Sub RefreshGrid()
    Dim i As Integer
    grdCustomers.Rows = customers.Count + 1
    
    For i = 1 To customers.Count
        Dim customer As Dictionary
        Set customer = customers(i)
        
        grdCustomers.TextMatrix(i, 0) = customer("ID")
        grdCustomers.TextMatrix(i, 1) = customer("Name")
        grdCustomers.TextMatrix(i, 2) = customer("Email")
        grdCustomers.TextMatrix(i, 3) = customer("Phone")
        grdCustomers.TextMatrix(i, 4) = customer("City")
    Next i
End Sub

Private Sub btnAdd_Click()
    If txtName.Text <> "" And txtEmail.Text <> "" Then
        Dim newId As Long
        newId = customers.Count + 1
        
        AddCustomer newId, txtName.Text, txtEmail.Text, "", ""
        RefreshGrid
        
        txtName.Text = ""
        txtEmail.Text = ""
        
        MsgBox "Customer added successfully!"
    Else
        MsgBox "Please enter name and email.", vbExclamation
    End If
End Sub
`,
          },
        },
      ],
    },
    {
      id: 'activex-showcase',
      title: 'ActiveX Controls Demo',
      description: 'Showcase ActiveX controls through WebAssembly bridge',
      category: 'ActiveX Demo',
      duration: 25000,
      steps: [
        {
          id: 'create-activex-form',
          action: 'createForm',
          description: 'Create ActiveX demonstration form',
          duration: 2000,
          data: { name: 'ActiveXDemo', width: 800, height: 600 },
        },
        {
          id: 'add-msflexgrid',
          action: 'addActiveXControl',
          description: 'Add MSFlexGrid control',
          duration: 4000,
          data: {
            type: 'MSFlexGrid',
            name: 'MSFlexGrid1',
            x: 20,
            y: 20,
            width: 350,
            height: 200,
            clsid: '{5F4DF280-531B-11CF-91F6-C2863C385E30}',
          },
        },
        {
          id: 'add-mschart',
          action: 'addActiveXControl',
          description: 'Add MSChart control',
          duration: 4000,
          data: {
            type: 'MSChart',
            name: 'MSChart1',
            x: 400,
            y: 20,
            width: 350,
            height: 200,
            clsid: '{3A2B370C-BA0A-11D1-B137-0000F8753F5D}',
          },
        },
        {
          id: 'add-webbrowser',
          action: 'addActiveXControl',
          description: 'Add WebBrowser control',
          duration: 4000,
          data: {
            type: 'WebBrowser',
            name: 'WebBrowser1',
            x: 20,
            y: 250,
            width: 730,
            height: 300,
            clsid: '{8856F961-340A-11D0-A96B-00C04FD705A2}',
          },
        },
        {
          id: 'configure-activex',
          action: 'configureActiveX',
          description: 'Configure ActiveX controls',
          duration: 6000,
          data: {
            flexgrid: {
              rows: 5,
              cols: 4,
              data: [
                ['Product', 'Price', 'Quantity', 'Total'],
                ['Widget A', '$10.00', '5', '$50.00'],
                ['Widget B', '$15.00', '3', '$45.00'],
                ['Widget C', '$8.50', '10', '$85.00'],
              ],
            },
            chart: {
              chartType: 'Bar',
              data: [10, 25, 15, 30, 20],
              title: 'Sales Data',
            },
            browser: {
              url: 'about:blank',
              html: '<h1>VB6 Web IDE</h1><p>ActiveX WebBrowser Control Demo</p>',
            },
          },
        },
        {
          id: 'test-activex',
          action: 'testActiveX',
          description: 'Test ActiveX functionality',
          duration: 5000,
          data: {
            tests: ['grid-selection', 'chart-update', 'browser-navigation'],
          },
        },
      ],
    },
  ];

  const runDemo = useCallback(async () => {
    setIsRunning(true);
    setIsComplete(false);
    setCurrentStep(0);

    const scenario = demoScenarios[currentScenario];

    for (let i = 0; i < scenario.steps.length; i++) {
      setCurrentStep(i);
      const step = scenario.steps[i];

      // Execute step action
      await executeStep(step);

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    setIsComplete(true);
    setIsRunning(false);
  }, [currentScenario, demoScenarios]);

  const executeStep = async (step: DemoStep) => {
    switch (step.action) {
      case 'createForm':
        // Simulate form creation
        break;

      case 'addControl': {
        // Add a single control
        const control: Control = {
          id: Date.now(),
          type: step.data.type,
          name: step.data.name,
          x: step.data.x,
          y: step.data.y,
          width: step.data.width,
          height: step.data.height,
          ...step.data,
        };
        addControl(control);
        break;
      }

      case 'addButtons':
        // Add multiple buttons
        for (const buttonData of step.data.buttons) {
          const button: Control = {
            id: Date.now() + Math.random(),
            type: 'CommandButton',
            name: buttonData.name,
            x: buttonData.x,
            y: buttonData.y,
            width: buttonData.width || 60,
            height: buttonData.height || 40,
            caption: buttonData.text,
          };
          addControl(button);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        break;

      case 'addCode':
        // Simulate code addition
        break;

      case 'testApplication':
        // Simulate application testing
        break;

      case 'compileApplication':
        // Simulate compilation
        break;

      case 'addActiveXControl': {
        // Add ActiveX control
        const activeXControl: Control = {
          id: Date.now(),
          type: step.data.type,
          name: step.data.name,
          x: step.data.x,
          y: step.data.y,
          width: step.data.width,
          height: step.data.height,
          clsid: step.data.clsid,
        };
        addControl(activeXControl);
        break;
      }

      default:
    }
  };

  const stopDemo = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
  }, []);

  const nextScenario = useCallback(() => {
    setCurrentScenario(prev => (prev + 1) % demoScenarios.length);
    setCurrentStep(0);
    setIsComplete(false);
  }, [demoScenarios.length]);

  const prevScenario = useCallback(() => {
    setCurrentScenario(prev => (prev - 1 + demoScenarios.length) % demoScenarios.length);
    setCurrentStep(0);
    setIsComplete(false);
  }, [demoScenarios.length]);

  const currentScenarioData = demoScenarios[currentScenario];

  return (
    <div className="h-full bg-gray-900 text-white p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">VB6 IDE Demo Runner</h1>
        <p className="text-gray-300">Automated demonstrations of VB6 Web IDE capabilities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Scenario Selection */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Demo Scenarios</h2>

          <div className="space-y-3 mb-6">
            {demoScenarios.map((scenario, index) => (
              <div
                key={scenario.id}
                onClick={() => setCurrentScenario(index)}
                className={`p-3 rounded cursor-pointer transition-all ${
                  index === currentScenario
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">{scenario.title}</div>
                <div className="text-sm opacity-80">{scenario.category}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.floor(scenario.duration / 1000)}s duration
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={runDemo}
              disabled={isRunning}
              className={`w-full py-2 px-4 rounded font-semibold transition-all ${
                isRunning ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRunning ? 'Running...' : 'Start Demo'}
            </button>

            {isRunning && (
              <button
                onClick={stopDemo}
                className="w-full py-2 px-4 rounded font-semibold bg-red-600 hover:bg-red-700 transition-all"
              >
                Stop Demo
              </button>
            )}
          </div>
        </div>

        {/* Current Scenario Details */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">{currentScenarioData.title}</h2>
          <p className="text-gray-300 mb-4">{currentScenarioData.description}</p>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>
                {currentStep + 1} / {currentScenarioData.steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / currentScenarioData.steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentScenarioData.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-2 rounded text-sm ${
                  index < currentStep
                    ? 'bg-green-600 bg-opacity-30 text-green-400'
                    : index === currentStep && isRunning
                      ? 'bg-yellow-600 bg-opacity-30 text-yellow-400 animate-pulse'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                <div className="font-semibold">{step.description}</div>
                <div className="text-xs opacity-80">
                  {step.action} ({step.duration}ms)
                </div>
              </div>
            ))}
          </div>

          {isComplete && (
            <div className="mt-4 p-3 bg-green-600 bg-opacity-30 rounded text-green-400 text-center">
              ✓ Demo completed successfully!
            </div>
          )}
        </div>

        {/* Demo Output/Preview */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Demo Preview</h2>

          <div className="bg-gray-700 rounded p-4 h-64 overflow-hidden relative">
            {isRunning && (
              <div className="absolute inset-0 bg-blue-600 bg-opacity-10 animate-pulse" />
            )}

            <div className="text-center text-gray-400">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-2xl">
                  🎯
                </div>
              </div>
              <div>Demo visualization will appear here</div>
              <div className="text-sm mt-2">
                Step {currentStep + 1}: {currentScenarioData.steps[currentStep]?.description}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={prevScenario}
              className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={nextScenario}
              className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded transition-all"
            >
              Next →
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            <div>Current Controls: {controls.length}</div>
            <div>Selected: {selectedControls.length}</div>
            <div>Forms: {forms.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoRunner;
