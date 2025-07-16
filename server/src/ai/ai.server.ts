/**
 * AI Server for VB6 Studio
 * Backend for AI-powered code generation and assistance
 */

import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import * as tf from '@tensorflow/tfjs-node';
import natural from 'natural';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// AI Models configuration
const aiModels = {
  // OpenAI for advanced code generation (requires API key)
  openai: process.env.OPENAI_API_KEY ? new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
  ) : null,

  // TensorFlow.js for pattern recognition
  patternModel: null as tf.LayersModel | null,

  // Natural language processing
  tokenizer: new natural.WordTokenizer(),
  classifier: new natural.BayesClassifier(),
};

// VB6 code patterns database
const vb6Patterns = {
  formCreation: [
    {
      pattern: 'create form',
      template: `Private Sub Form_Load()
    Me.Caption = "{name}"
    Me.Width = {width}
    Me.Height = {height}
    CenterForm Me
End Sub

Private Sub CenterForm(frm As Form)
    frm.Move (Screen.Width - frm.Width) / 2, (Screen.Height - frm.Height) / 2
End Sub`,
    },
  ],
  databaseConnection: [
    {
      pattern: 'ado connection',
      template: `Dim conn As ADODB.Connection
Dim rs As ADODB.Recordset

Set conn = New ADODB.Connection
Set rs = New ADODB.Recordset

conn.ConnectionString = "{connectionString}"
conn.Open

rs.Open "{query}", conn, adOpenStatic, adLockReadOnly`,
    },
  ],
  errorHandling: [
    {
      pattern: 'error handling',
      template: `On Error GoTo ErrorHandler

' Your code here

Exit Sub

ErrorHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical
    Resume Next`,
    },
  ],
  loops: [
    {
      pattern: 'for loop',
      template: `For {variable} = {start} To {end} Step {step}
    ' Loop body
Next {variable}`,
    },
    {
      pattern: 'while loop',
      template: `Do While {condition}
    ' Loop body
Loop`,
    },
  ],
  controls: [
    {
      pattern: 'add button',
      template: `Private Sub Command{number}_Click()
    ' Button click handler
End Sub`,
    },
    {
      pattern: 'add textbox',
      template: `' TextBox properties
Text{number}.Text = "{defaultText}"
Text{number}.MaxLength = {maxLength}
Text{number}.PasswordChar = "{passwordChar}"`,
    },
  ],
};

// Train the classifier with VB6 patterns
function trainClassifier() {
  // Add training data for intent classification
  aiModels.classifier.addDocument('create a form', 'form_creation');
  aiModels.classifier.addDocument('make new form', 'form_creation');
  aiModels.classifier.addDocument('database connection', 'database');
  aiModels.classifier.addDocument('connect to database', 'database');
  aiModels.classifier.addDocument('ado connection', 'database');
  aiModels.classifier.addDocument('error handling', 'error_handling');
  aiModels.classifier.addDocument('handle errors', 'error_handling');
  aiModels.classifier.addDocument('for loop', 'loop');
  aiModels.classifier.addDocument('while loop', 'loop');
  aiModels.classifier.addDocument('add button', 'control');
  aiModels.classifier.addDocument('create button', 'control');
  aiModels.classifier.addDocument('add textbox', 'control');
  
  aiModels.classifier.train();
}

// Initialize AI models
async function initializeAI() {
  trainClassifier();
  
  // Load TensorFlow model if available
  try {
    const modelPath = './models/vb6-pattern-model';
    const fs = await import('fs');
    if (fs.existsSync(modelPath)) {
      aiModels.patternModel = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      console.log('Pattern recognition model loaded');
    }
  } catch (error) {
    console.log('Pattern model not found, using rule-based system');
  }
}

// Generate code based on request
async function generateCode(request: string, context: any): Promise<any> {
  const intent = aiModels.classifier.classify(request);
  
  // Use OpenAI if available for complex requests
  if (aiModels.openai && isComplexRequest(request)) {
    try {
      const completion = await aiModels.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Generate VB6 code for: ${request}\nContext: ${JSON.stringify(context)}`,
        temperature: 0.7,
        max_tokens: 500,
      });
      
      return {
        code: completion.data.choices[0].text,
        suggestions: [],
        confidence: 0.95,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }
  
  // Fallback to pattern-based generation
  return generateFromPatterns(request, intent, context);
}

// Generate code from patterns
function generateFromPatterns(request: string, intent: string, context: any): any {
  const suggestions = [];
  
  switch (intent) {
    case 'form_creation':
      suggestions.push({
        type: 'completion',
        title: 'Create VB6 Form',
        description: 'Generate a new form with standard initialization',
        code: fillTemplate(vb6Patterns.formCreation[0].template, {
          name: extractName(request) || 'Form1',
          width: 8000,
          height: 6000,
        }),
        confidence: 0.85,
      });
      break;
      
    case 'database': {
      const dbType = request.includes('ado') ? 'ado' : 'dao';
      suggestions.push({
        type: 'completion',
        title: 'Database Connection Code',
        description: `Create ${dbType.toUpperCase()} database connection`,
        code: fillTemplate(vb6Patterns.databaseConnection[0].template, {
          connectionString: 'Provider=SQLOLEDB;Data Source=localhost;Initial Catalog=MyDB;Integrated Security=SSPI;',
          query: 'SELECT * FROM Users',
        }),
        confidence: 0.90,
      });
      break;
    }
      
    case 'error_handling':
      suggestions.push({
        type: 'completion',
        title: 'Error Handling Pattern',
        description: 'Add comprehensive error handling',
        code: vb6Patterns.errorHandling[0].template,
        confidence: 0.88,
      });
      break;
      
    case 'loop': {
      const loopType = request.includes('while') ? 'while' : 'for';
      const pattern = vb6Patterns.loops.find(p => p.pattern.includes(loopType));
      if (pattern) {
        suggestions.push({
          type: 'completion',
          title: `${loopType} Loop`,
          description: `Create a ${loopType} loop structure`,
          code: fillTemplate(pattern.template, {
            variable: 'i',
            start: 1,
            end: 10,
            step: 1,
            condition: 'condition = True',
          }),
          confidence: 0.92,
        });
      }
      break;
    }
      
    case 'control': {
      const controlType = request.includes('button') ? 'button' : 'textbox';
      const controlPattern = vb6Patterns.controls.find(p => p.pattern.includes(controlType));
      if (controlPattern) {
        suggestions.push({
          type: 'completion',
          title: `Add ${controlType}`,
          description: `Create a new ${controlType} with event handlers`,
          code: fillTemplate(controlPattern.template, {
            number: context.controls ? context.controls.length + 1 : 1,
            defaultText: '',
            maxLength: 255,
            passwordChar: '',
          }),
          confidence: 0.87,
        });
      }
      break;
    }
  }
  
  return {
    suggestions,
    intent,
    confidence: suggestions.length > 0 ? suggestions[0].confidence : 0.5,
  };
}

// Helper functions
function isComplexRequest(request: string): boolean {
  const complexKeywords = ['algorithm', 'optimize', 'refactor', 'convert', 'complex', 'advanced'];
  return complexKeywords.some(keyword => request.toLowerCase().includes(keyword));
}

function extractName(request: string): string {
  const nameMatch = request.match(/named?\s+["']?(\w+)["']?/i);
  return nameMatch ? nameMatch[1] : '';
}

function fillTemplate(template: string, values: Record<string, any>): string {
  let filled = template;
  Object.entries(values).forEach(([key, value]) => {
    filled = filled.replace(new RegExp(`{${key}}`, 'g'), String(value));
  });
  return filled;
}

// API Endpoints

// Generate code endpoint
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { request, context } = req.body;
    const result = await generateCode(request, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze code endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Analyze code for issues
    const issues = [];
    const lines = code.split('\n');
    
    // Check for common VB6 issues
    lines.forEach((line, index) => {
      // Check for undeclared variables
      if (line.match(/^\s*\w+\s*=/) && !line.includes('Dim') && !line.includes('Set')) {
        issues.push({
          line: index + 1,
          type: 'warning',
          message: 'Possible undeclared variable',
          suggestion: 'Add Dim statement for the variable',
        });
      }
      
      // Check for missing error handling
      if (line.includes('Open') || line.includes('Execute')) {
        const hasErrorHandling = lines.slice(Math.max(0, index - 5), index)
          .some(l => l.includes('On Error'));
        if (!hasErrorHandling) {
          issues.push({
            line: index + 1,
            type: 'warning',
            message: 'Missing error handling for risky operation',
            suggestion: 'Add On Error GoTo ErrorHandler before this line',
          });
        }
      }
    });
    
    res.json({ issues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optimize code endpoint
app.post('/api/ai/optimize', async (req, res) => {
  try {
    const { code } = req.body;
    
    const optimizations = [];
    const lines = code.split('\n');
    
    // Look for optimization opportunities
    lines.forEach((line, index) => {
      // String concatenation in loops
      if (line.includes('=') && line.includes('&') && isInLoop(lines, index)) {
        optimizations.push({
          line: index + 1,
          type: 'performance',
          message: 'String concatenation in loop detected',
          suggestion: 'Use StringBuilder for better performance',
          optimizedCode: '// Use StringBuilder instead',
        });
      }
      
      // Repeated object access
      const objectAccess = line.match(/(\w+\.\w+\.\w+)/g);
      if (objectAccess && objectAccess.length > 1) {
        optimizations.push({
          line: index + 1,
          type: 'performance',
          message: 'Multiple object property access',
          suggestion: 'Cache object reference in variable',
        });
      }
    });
    
    res.json({ optimizations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert code endpoint
app.post('/api/ai/convert', async (req, res) => {
  try {
    const { code, targetLanguage } = req.body;
    
    // Simple conversion logic (extend for real implementation)
    let convertedCode = code;
    
    switch (targetLanguage) {
      case 'csharp':
        convertedCode = convertToCSharp(code);
        break;
      case 'typescript':
        convertedCode = convertToTypeScript(code);
        break;
      case 'python':
        convertedCode = convertToPython(code);
        break;
    }
    
    res.json({
      convertedCode,
      language: targetLanguage,
      confidence: 0.85,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conversion helpers
function convertToCSharp(vb6Code: string): string {
  let cs = vb6Code;
  
  // Basic conversions
  cs = cs.replace(/Dim\s+(\w+)\s+As\s+(\w+)/g, '$2 $1;');
  cs = cs.replace(/Private Sub\s+(\w+)\s*\((.*?)\)/g, 'private void $1($2)');
  cs = cs.replace(/End Sub/g, '}');
  cs = cs.replace(/MsgBox/g, 'MessageBox.Show');
  cs = cs.replace(/vbCrLf/g, '\\n');
  
  return cs;
}

function convertToTypeScript(vb6Code: string): string {
  let ts = vb6Code;
  
  // Basic conversions
  ts = ts.replace(/Dim\s+(\w+)\s+As\s+String/g, 'let $1: string;');
  ts = ts.replace(/Dim\s+(\w+)\s+As\s+Integer/g, 'let $1: number;');
  ts = ts.replace(/Private Sub\s+(\w+)\s*\((.*?)\)/g, 'function $1($2): void {');
  ts = ts.replace(/End Sub/g, '}');
  ts = ts.replace(/MsgBox/g, 'alert');
  
  return ts;
}

function convertToPython(vb6Code: string): string {
  let py = vb6Code;
  
  // Basic conversions
  py = py.replace(/Dim\s+(\w+)\s+As\s+\w+/g, '$1 = None');
  py = py.replace(/Private Sub\s+(\w+)\s*\((.*?)\)/g, 'def $1($2):');
  py = py.replace(/End Sub/g, '');
  py = py.replace(/MsgBox/g, 'print');
  
  return py;
}

function isInLoop(lines: string[], index: number): boolean {
  // Check if line is inside a loop
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].includes('For') || lines[i].includes('Do') || lines[i].includes('While')) {
      return true;
    }
    if (lines[i].includes('End Sub') || lines[i].includes('End Function')) {
      return false;
    }
  }
  return false;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: {
      openai: !!aiModels.openai,
      classifier: true,
      patternModel: !!aiModels.patternModel,
    },
  });
});

// Start server
const PORT = process.env.AI_PORT || 3003;

initializeAI().then(() => {
  app.listen(PORT, () => {
    console.log(`AI server running on port ${PORT}`);
  });
});

export default app;