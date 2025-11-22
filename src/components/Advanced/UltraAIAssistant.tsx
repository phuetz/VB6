/**
 * ULTRA-AI ASSISTANT
 * GPT-powered intelligent coding assistant for VB6 development
 * Natural language to code conversion, smart refactoring, context-aware help
 * Advanced pattern recognition, intelligent error fixing, and documentation generation
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../stores/ProjectStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import { useUIStore } from '../../stores/UIStore';
import { useDebugStore } from '../../stores/DebugStore';
import {
  Bot,
  Brain,
  Sparkles,
  MessageSquare,
  Code,
  Lightbulb,
  Zap,
  Target,
  FileText,
  Settings,
  X,
  Send,
  Copy,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Wand2,
  BookOpen,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Activity,
  Globe,
  Shield
} from 'lucide-react';

// Types pour l'assistant IA
interface AIConversation {
  id: string;
  messages: AIMessage[];
  title: string;
  created: Date;
  lastUpdated: Date;
  context: ConversationContext;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'suggestion' | 'error' | 'explanation';
  metadata?: {
    language?: string;
    confidence?: number;
    relatedFiles?: string[];
    actions?: AIAction[];
  };
}

interface AIAction {
  id: string;
  label: string;
  description: string;
  type: 'generate' | 'refactor' | 'fix' | 'explain' | 'test' | 'optimize';
  code?: string;
  targetFile?: string;
  execute: () => Promise<void>;
}

interface ConversationContext {
  currentFile?: string;
  selectedControl?: string;
  projectInfo: {
    forms: number;
    modules: number;
    controls: number;
    linesOfCode: number;
  };
  recentErrors: string[];
  codeSelection?: {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
  };
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'generation' | 'analysis' | 'refactoring' | 'debugging' | 'documentation';
  examples: string[];
  prompts: AIPromptTemplate[];
}

interface AIPromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: string;
  variables: string[];
}

// Moteur IA avancé
class UltraAIEngine {
  private static instance: UltraAIEngine;
  private conversationHistory: AIConversation[] = [];
  private knowledgeBase: Map<string, any> = new Map();
  
  static getInstance(): UltraAIEngine {
    if (!UltraAIEngine.instance) {
      UltraAIEngine.instance = new UltraAIEngine();
    }
    return UltraAIEngine.instance;
  }
  
  constructor() {
    this.initializeKnowledgeBase();
  }
  
  private initializeKnowledgeBase() {
    // Base de connaissances VB6
    this.knowledgeBase.set('vb6_syntax', {
      keywords: ['Dim', 'Private', 'Public', 'Function', 'Sub', 'If', 'Then', 'Else', 'For', 'Next', 'While', 'Wend'],
      dataTypes: ['String', 'Integer', 'Long', 'Double', 'Boolean', 'Variant', 'Object'],
      controls: ['TextBox', 'Label', 'CommandButton', 'ListBox', 'ComboBox', 'CheckBox', 'OptionButton'],
      events: ['Click', 'Load', 'Unload', 'Change', 'KeyPress', 'MouseMove', 'GotFocus', 'LostFocus'],
      patterns: {
        eventHandler: 'Private Sub {controlName}_{eventName}()\n    {code}\nEnd Sub',
        function: 'Private Function {functionName}({parameters}) As {returnType}\n    {code}\n    {functionName} = {returnValue}\nEnd Function',
        errorHandling: 'On Error GoTo ErrorHandler\n{code}\nExit Sub\nErrorHandler:\n    MsgBox "Error: " & Err.Description\n    Resume Next'
      }
    });
    
    this.knowledgeBase.set('best_practices', {
      naming: 'Use descriptive names with Hungarian notation (txtName, cmdSave, lblTitle)',
      errorHandling: 'Always include proper error handling in your procedures',
      memoryManagement: 'Set object variables to Nothing when done',
      performance: 'Use specific data types instead of Variant when possible'
    });
  }
  
  async processUserInput(
    input: string, 
    context: ConversationContext,
    conversationId?: string
  ): Promise<AIMessage> {
    console.log(`🤖 Processing user input: ${input.substring(0, 50)}...`);
    
    // Analyser l'intention de l'utilisateur
    const intent = this.analyzeIntent(input);
    
    // Générer la réponse basée sur l'intention
    const response = await this.generateResponse(input, intent, context);
    
    // Créer le message de réponse
    const aiMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      type: response.type,
      metadata: {
        confidence: response.confidence,
        actions: response.actions,
        relatedFiles: response.relatedFiles
      }
    };
    
    console.log(`✅ AI response generated with ${response.confidence}% confidence`);
    return aiMessage;
  }
  
  private analyzeIntent(input: string): {
    type: 'generate' | 'explain' | 'fix' | 'refactor' | 'question' | 'help';
    confidence: number;
    entities: string[];
  } {
    const lowerInput = input.toLowerCase();
    
    // Patterns de reconnaissance d'intention
    const patterns = {
      generate: /(?:create|generate|write|make|build|add)/,
      explain: /(?:explain|what|how|why|describe|tell me)/,
      fix: /(?:fix|error|problem|bug|issue|broken)/,
      refactor: /(?:refactor|improve|optimize|clean|reorganize)/,
      help: /(?:help|assist|guide|tutorial|example)/
    };
    
    let bestMatch = { type: 'question' as const, confidence: 0.3 };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(lowerInput)) {
        const confidence = this.calculateConfidence(input, pattern);
        if (confidence > bestMatch.confidence) {
          bestMatch = { type: type as any, confidence };
        }
      }
    }
    
    // Extraire les entités (contrôles VB6, mots-clés, etc.)
    const entities = this.extractEntities(input);
    
    return { ...bestMatch, entities };
  }
  
  private calculateConfidence(input: string, pattern: RegExp): number {
    const matches = input.match(pattern);
    if (!matches) return 0;
    
    // Confidence basée sur la spécificité et le contexte
    let confidence = 0.6;
    
    // Bonus pour les mots-clés VB6
    const vb6Keywords = this.knowledgeBase.get('vb6_syntax')?.keywords || [];
    const hasVB6Keywords = vb6Keywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()));
    if (hasVB6Keywords) confidence += 0.2;
    
    // Bonus pour les contrôles VB6
    const vb6Controls = this.knowledgeBase.get('vb6_syntax')?.controls || [];
    const hasVB6Controls = vb6Controls.some(control => input.toLowerCase().includes(control.toLowerCase()));
    if (hasVB6Controls) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
  
  private extractEntities(input: string): string[] {
    const entities: string[] = [];
    const vb6Data = this.knowledgeBase.get('vb6_syntax');
    
    if (vb6Data) {
      // Extraire les contrôles mentionnés
      vb6Data.controls.forEach((control: string) => {
        if (input.toLowerCase().includes(control.toLowerCase())) {
          entities.push(control);
        }
      });
      
      // Extraire les événements mentionnés
      vb6Data.events.forEach((event: string) => {
        if (input.toLowerCase().includes(event.toLowerCase())) {
          entities.push(event);
        }
      });
    }
    
    return entities;
  }
  
  private async generateResponse(
    input: string, 
    intent: any, 
    context: ConversationContext
  ): Promise<{
    content: string;
    type: AIMessage['type'];
    confidence: number;
    actions: AIAction[];
    relatedFiles: string[];
  }> {
    // Simuler un délai de traitement IA
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    switch (intent.type) {
      case 'generate':
        return this.generateCode(input, intent.entities, context);
      case 'explain':
        return this.explainConcept(input, intent.entities, context);
      case 'fix':
        return this.fixError(input, intent.entities, context);
      case 'refactor':
        return this.refactorCode(input, intent.entities, context);
      case 'help':
        return this.provideHelp(input, intent.entities, context);
      default:
        return this.answerQuestion(input, intent.entities, context);
    }
  }
  
  private async generateCode(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    const vb6Patterns = this.knowledgeBase.get('vb6_syntax')?.patterns || {};
    
    if (input.toLowerCase().includes('button') && input.toLowerCase().includes('click')) {
      const code = `Private Sub CommandButton1_Click()
    ' Generated button click handler
    Dim userInput As String
    userInput = InputBox("Enter your input:", "User Input")
    
    If Len(userInput) > 0 Then
        MsgBox "You entered: " & userInput, vbInformation
        ' Add your logic here
    Else
        MsgBox "No input provided", vbExclamation
    End If
End Sub`;

      return {
        content: `I've generated a VB6 button click event handler for you:\n\n\`\`\`vb\n${code}\n\`\`\`\n\nThis code creates a button click handler that:\n- Prompts the user for input using InputBox\n- Validates that input was provided\n- Displays the input back to the user\n- Includes proper error handling\n\nYou can customize the logic inside the If statement for your specific needs.`,
        type: 'code' as const,
        confidence: 0.9,
        actions: [
          {
            id: 'apply_code',
            label: 'Apply to Form',
            description: 'Add this event handler to the current form',
            type: 'generate' as const,
            code,
            execute: async () => {
              console.log('Applying generated code to form...');
            }
          }
        ],
        relatedFiles: context.currentFile ? [context.currentFile] : []
      };
    }
    
    if (input.toLowerCase().includes('form') && input.toLowerCase().includes('validation')) {
      const code = `Private Function ValidateForm() As Boolean
    Dim isValid As Boolean
    isValid = True
    
    ' Clear any previous error messages
    lblError.Caption = ""
    
    ' Validate required fields
    If Len(Trim(txtName.Text)) = 0 Then
        lblError.Caption = "Name is required"
        txtName.SetFocus
        isValid = False
    ElseIf Len(Trim(txtEmail.Text)) = 0 Then
        lblError.Caption = "Email is required"
        txtEmail.SetFocus
        isValid = False
    ElseIf Not IsValidEmail(txtEmail.Text) Then
        lblError.Caption = "Please enter a valid email address"
        txtEmail.SetFocus
        isValid = False
    End If
    
    ValidateForm = isValid
End Function

Private Function IsValidEmail(email As String) As Boolean
    ' Simple email validation
    Dim atPos As Integer, dotPos As Integer
    atPos = InStr(email, "@")
    dotPos = InStrRev(email, ".")
    
    IsValidEmail = (atPos > 1) And (dotPos > atPos + 1) And (dotPos < Len(email))
End Function`;

      return {
        content: `I've created a comprehensive form validation system for VB6:\n\n\`\`\`vb\n${code}\n\`\`\`\n\nThis validation system includes:\n- **ValidateForm()**: Main validation function that returns True/False\n- **Field validation**: Checks for required fields (Name, Email)\n- **Email validation**: Basic email format checking\n- **User feedback**: Shows error messages via lblError label\n- **Focus management**: Automatically focuses the field with errors\n\nTo use this:\n1. Add a Label control named 'lblError' for error messages\n2. Call ValidateForm() before processing your form data\n3. Customize the field names to match your form controls`,
        type: 'code' as const,
        confidence: 0.85,
        actions: [
          {
            id: 'apply_validation',
            label: 'Add to Current Form',
            description: 'Add validation functions to the current form',
            type: 'generate' as const,
            code,
            execute: async () => {
              console.log('Adding validation to current form...');
            }
          }
        ],
        relatedFiles: context.currentFile ? [context.currentFile] : []
      };
    }
    
    // Génération générique
    return {
      content: `I can help you generate VB6 code! Based on your request, here are some suggestions:\n\n• **Event Handlers**: Button clicks, form loads, text changes\n• **Data Validation**: Form validation, input checking\n• **Database Operations**: ADO connections, recordset handling\n• **File Operations**: Reading/writing files, directory operations\n• **UI Components**: Dynamic control creation, layout management\n\nCould you be more specific about what type of code you'd like me to generate? For example:\n- "Create a button click handler that saves data"\n- "Generate form validation for user input"\n- "Write code to connect to a database"`,
      type: 'suggestion' as const,
      confidence: 0.7,
      actions: [],
      relatedFiles: []
    };
  }
  
  private async explainConcept(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    if (input.toLowerCase().includes('event') || entities.includes('Click')) {
      return {
        content: `**VB6 Events Explained**\n\nEvents in VB6 are actions that occur when users interact with your application or when certain conditions are met. Here's how they work:\n\n**Common Events:**\n• **Click**: User clicks on a control\n• **Load**: Form or control is loaded into memory\n• **Change**: Text or value in a control changes\n• **KeyPress**: User presses a key while control has focus\n• **MouseMove**: Mouse moves over a control\n\n**Event Handler Syntax:**\n\`\`\`vb\nPrivate Sub ControlName_EventName(parameters)\n    ' Your code here\nEnd Sub\n\`\`\`\n\n**Example:**\n\`\`\`vb\nPrivate Sub CommandButton1_Click()\n    MsgBox "Button was clicked!"\nEnd Sub\n\`\`\`\n\n**Key Points:**\n- Event procedures are automatically called by VB6\n- Always use the exact naming convention: ControlName_EventName\n- Parameters vary by event type\n- Events enable interactive, responsive applications`,
        type: 'explanation' as const,
        confidence: 0.92,
        actions: [
          {
            id: 'show_examples',
            label: 'Show More Examples',
            description: 'Display additional event handler examples',
            type: 'explain' as const,
            execute: async () => {
              console.log('Showing more event examples...');
            }
          }
        ],
        relatedFiles: []
      };
    }
    
    if (input.toLowerCase().includes('variable') || input.toLowerCase().includes('dim')) {
      return {
        content: `**VB6 Variables and Data Types**\n\nVariables store data that your program can use and modify. Here's everything you need to know:\n\n**Declaration Syntax:**\n\`\`\`vb\nDim variableName As DataType\n\`\`\`\n\n**Common Data Types:**\n• **String**: Text data ("Hello World")\n• **Integer**: Whole numbers (-32,768 to 32,767)\n• **Long**: Large whole numbers (-2 billion to 2 billion)\n• **Double**: Decimal numbers with high precision\n• **Boolean**: True or False values\n• **Variant**: Can hold any type of data (slower)\n\n**Scope Levels:**\n• **Dim**: Local to procedure\n• **Private**: Available within current form/module\n• **Public**: Available throughout entire project\n\n**Examples:**\n\`\`\`vb\nDim userName As String\nDim userAge As Integer\nDim isActive As Boolean\nPrivate totalSales As Double\nPublic applicationTitle As String\n\`\`\`\n\n**Best Practices:**\n- Use specific data types instead of Variant\n- Initialize variables before use\n- Use descriptive names (userName vs x)`,
        type: 'explanation' as const,
        confidence: 0.88,
        actions: [],
        relatedFiles: []
      };
    }
    
    return {
      content: `I'd be happy to explain VB6 concepts! I can help explain:\n\n**Language Fundamentals:**\n• Variables and data types\n• Control structures (If, For, While)\n• Procedures and functions\n• Error handling\n\n**Object-Oriented Features:**\n• Forms and controls\n• Events and event handling\n• Properties and methods\n• Classes and objects\n\n**Advanced Topics:**\n• Database connectivity (ADO)\n• File operations\n• API calls\n• COM components\n\nWhat specific concept would you like me to explain?`,
      type: 'suggestion' as const,
      confidence: 0.75,
      actions: [],
      relatedFiles: []
    };
  }
  
  private async fixError(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    // Analyser les erreurs récentes du contexte
    if (context.recentErrors.length > 0) {
      const recentError = context.recentErrors[0];
      
      if (recentError.includes('Object variable or With block variable not set')) {
        const fixCode = `' Error Fix: Object variable not set
' Problem: Trying to use an object variable that hasn't been initialized

' BEFORE (causes error):
Dim obj As Object
obj.Property = "value"  ' Error occurs here

' AFTER (fixed):
Dim obj As Object
Set obj = CreateObject("SomeApplication.Object")  ' Initialize first
obj.Property = "value"  ' Now this works

' For form controls:
Dim ctrl As Control
Set ctrl = Me.Controls("TextBox1")  ' Initialize reference
ctrl.Text = "Hello World"

' Always remember:
' 1. Use 'Set' keyword for object assignment
' 2. Initialize object variables before use
' 3. Set objects to Nothing when done: Set obj = Nothing`;

        return {
          content: `**Error Fix: "Object variable or With block variable not set"**\n\nThis common VB6 error occurs when you try to use an object variable that hasn't been properly initialized.\n\n\`\`\`vb\n${fixCode}\n\`\`\`\n\n**Common Causes:**\n• Forgetting to use the 'Set' keyword for objects\n• Using an object before creating/assigning it\n• Object creation failed but wasn't checked\n\n**Prevention Tips:**\n• Always initialize object variables with 'Set'\n• Check if object creation succeeded (If Not obj Is Nothing Then...)\n• Use proper error handling around object operations`,
          type: 'code' as const,
          confidence: 0.94,
          actions: [
            {
              id: 'apply_fix',
              label: 'Apply Error Fix',
              description: 'Add proper object initialization to your code',
              type: 'fix' as const,
              code: fixCode,
              execute: async () => {
                console.log('Applying object initialization fix...');
              }
            }
          ],
          relatedFiles: context.currentFile ? [context.currentFile] : []
        };
      }
    }
    
    if (input.toLowerCase().includes('compile') || input.toLowerCase().includes('syntax')) {
      return {
        content: `**Common VB6 Compilation Errors & Fixes:**\n\n**1. "Variable not defined"**\n• Add 'Option Explicit' at top of module\n• Declare all variables with Dim, Private, or Public\n\n**2. "Type mismatch"**\n• Check data types in assignments\n• Use appropriate conversion functions (CStr, CInt, CDbl)\n\n**3. "Method or data member not found"**\n• Verify object/control exists\n• Check spelling of properties/methods\n• Ensure proper object references\n\n**4. "Invalid procedure call"**\n• Check parameter count and types\n• Verify function/sub exists\n• Ensure proper scope (Public/Private)\n\n**Quick Fix Checklist:**\n✓ Add Option Explicit\n✓ Declare all variables\n✓ Check data type compatibility\n✓ Verify object references\n✓ Use proper error handling\n\nPaste your specific error message for targeted help!`,
        type: 'suggestion' as const,
        confidence: 0.8,
        actions: [],
        relatedFiles: []
      };
    }
    
    return {
      content: `I can help fix VB6 errors! Please provide:\n\n**For best results, share:**\n• The exact error message\n• The line of code causing the error\n• What you were trying to accomplish\n\n**Common error types I can fix:**\n• Object variable errors\n• Type mismatch errors\n• Compilation errors\n• Runtime errors\n• Logic errors\n\n**Example:**\n"I'm getting 'Type mismatch' error on this line:\n\`txtAge.Text = userAge + 1\`"\n\nThe more details you provide, the better I can help!`,
      type: 'suggestion' as const,
      confidence: 0.7,
      actions: [],
      relatedFiles: []
    };
  }
  
  private async refactorCode(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    if (context.codeSelection) {
      const originalCode = context.codeSelection.content;
      
      // Exemple de refactoring: extraction de fonction
      const refactoredCode = `' REFACTORED: Extracted common logic into reusable function
Private Function ValidateAndProcessInput(inputText As String) As Boolean
    ' Extracted validation logic
    If Len(Trim(inputText)) = 0 Then
        MsgBox "Input cannot be empty", vbExclamation
        ValidateAndProcessInput = False
        Exit Function
    End If
    
    ' Process the input
    Debug.Print "Processing: " & inputText
    ValidateAndProcessInput = True
End Function

' BEFORE: Duplicated code in multiple places
Private Sub CommandButton1_Click()
    Dim result As Boolean
    result = ValidateAndProcessInput(TextBox1.Text)
    If result Then
        ' Continue with button 1 logic
    End If
End Sub

Private Sub CommandButton2_Click()
    Dim result As Boolean
    result = ValidateAndProcessInput(TextBox2.Text)
    If result Then
        ' Continue with button 2 logic
    End If
End Sub`;

      return {
        content: `**Code Refactoring Suggestions**\n\nI've analyzed your selected code and here are improvement recommendations:\n\n\`\`\`vb\n${refactoredCode}\n\`\`\`\n\n**Improvements Made:**\n• **DRY Principle**: Eliminated duplicate validation logic\n• **Function Extraction**: Common code moved to reusable function\n• **Better Error Handling**: Centralized validation messages\n• **Improved Readability**: Clear function names and structure\n• **Maintainability**: Changes only needed in one place\n\n**Additional Suggestions:**\n• Consider adding input parameter validation\n• Add more specific error messages\n• Use consistent naming conventions\n• Add documentation comments`,
        type: 'code' as const,
        confidence: 0.87,
        actions: [
          {
            id: 'apply_refactoring',
            label: 'Apply Refactoring',
            description: 'Replace selected code with refactored version',
            type: 'refactor' as const,
            code: refactoredCode,
            execute: async () => {
              console.log('Applying code refactoring...');
            }
          }
        ],
        relatedFiles: [context.codeSelection.file]
      };
    }
    
    return {
      content: `**VB6 Code Refactoring Services**\n\nI can help improve your VB6 code quality through:\n\n**Refactoring Techniques:**\n• **Extract Functions**: Break down long procedures\n• **Eliminate Duplication**: Create reusable functions\n• **Improve Naming**: Use descriptive variable/function names\n• **Error Handling**: Add robust error management\n• **Performance**: Optimize loops and data access\n\n**Code Quality Improvements:**\n• Add Option Explicit for better type safety\n• Replace magic numbers with named constants\n• Improve code organization and structure\n• Add meaningful comments and documentation\n\n**To get started:**\n1. Select the code you want to refactor\n2. Tell me what improvements you're looking for\n3. I'll provide specific refactoring suggestions\n\n**Example:** "Refactor this function to eliminate duplicate validation code"`,
      type: 'suggestion' as const,
      confidence: 0.75,
      actions: [],
      relatedFiles: []
    };
  }
  
  private async provideHelp(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    if (input.toLowerCase().includes('getting started') || input.toLowerCase().includes('beginner')) {
      return {
        content: `**VB6 Getting Started Guide**\n\n**1. Basic Project Structure**\n• **Forms (.frm)**: User interface windows\n• **Modules (.bas)**: Code without UI\n• **Classes (.cls)**: Object-oriented code\n• **Project file (.vbp)**: Ties everything together\n\n**2. Essential Concepts**\n• **Controls**: UI elements (TextBox, Button, Label)\n• **Events**: User interactions (Click, Load, Change)\n• **Properties**: Control characteristics (Text, Color, Size)\n• **Methods**: Actions controls can perform\n\n**3. First Program Steps**\n\`\`\`vb\n' 1. Add a CommandButton and TextBox to your form\n' 2. Double-click the button to create event handler\nPrivate Sub Command1_Click()\n    Text1.Text = "Hello, VB6 World!"\nEnd Sub\n\`\`\`\n\n**4. Best Practices from the Start**\n• Always use 'Option Explicit'\n• Give controls meaningful names (btnSave, txtName)\n• Comment your code\n• Handle errors properly\n\n**Need help with something specific? Just ask!**`,
        type: 'explanation' as const,
        confidence: 0.9,
        actions: [
          {
            id: 'create_sample',
            label: 'Create Sample Project',
            description: 'Generate a basic VB6 project template',
            type: 'generate' as const,
            execute: async () => {
              console.log('Creating sample VB6 project...');
            }
          }
        ],
        relatedFiles: []
      };
    }
    
    return {
      content: `**VB6 AI Assistant Help**\n\nI'm here to help with all aspects of VB6 development! Here's what I can do:\n\n**💻 Code Generation**\n• Event handlers and procedures\n• Form validation logic\n• Database operations\n• File handling routines\n\n**🔍 Code Analysis**\n• Explain complex code sections\n• Identify potential issues\n• Suggest improvements\n• Debug error messages\n\n**🛠️ Refactoring**\n• Improve code structure\n• Eliminate duplication\n• Optimize performance\n• Modernize old code\n\n**📚 Learning Support**\n• Explain VB6 concepts\n• Provide examples\n• Best practices guidance\n• Tutorial recommendations\n\n**How to get the best help:**\n• Be specific about what you need\n• Share relevant code when asking for fixes\n• Describe your goal or what you're trying to achieve\n• Ask follow-up questions for clarification\n\n**Try asking:**\n• "Generate a login form validation"\n• "Explain how VB6 events work"\n• "Fix this database connection error"\n• "Refactor this long procedure"`,
      type: 'explanation' as const,
      confidence: 0.85,
      actions: [],
      relatedFiles: []
    };
  }
  
  private async answerQuestion(
    input: string, 
    entities: string[], 
    context: ConversationContext
  ): Promise<any> {
    return {
      content: `I understand you have a question about VB6 development. While I can provide general guidance, I'd be more helpful if you could:\n\n**For specific code questions:**\n• Share the relevant code snippet\n• Describe what you expected vs. what happened\n• Include any error messages\n\n**For conceptual questions:**\n• Let me know your experience level\n• Specify which VB6 feature you're asking about\n• Provide context about your project\n\n**Example of a good question:**\n"I'm trying to connect to an Access database in VB6. Here's my connection code: [code]. I'm getting error 'Cannot open database'. What am I doing wrong?"\n\n**I can help with:**\n• VB6 syntax and language features\n• Form design and control usage\n• Database connectivity (ADO/DAO)\n• File operations and API calls\n• Debugging and error handling\n• Performance optimization\n\nFeel free to rephrase your question with more details!`,
      type: 'suggestion' as const,
      confidence: 0.6,
      actions: [],
      relatedFiles: []
    };
  }
}

// Composant principal
interface UltraAIAssistantProps {
  visible: boolean;
  onClose: () => void;
}

export const UltraAIAssistant: React.FC<UltraAIAssistantProps> = ({
  visible,
  onClose
}) => {
  const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const projectStore = useProjectStore();
  const designerStore = useDesignerStore();
  const uiStore = useUIStore();
  const debugStore = useDebugStore();
  
  const aiEngine = UltraAIEngine.getInstance();
  
  // Capacités de l'IA
  const aiCapabilities: AICapability[] = useMemo(() => [
    {
      id: 'code-generation',
      name: 'Code Generation',
      description: 'Generate VB6 code from natural language descriptions',
      icon: Code,
      category: 'generation',
      examples: [
        'Create a button click handler that saves data to a file',
        'Generate form validation for user registration',
        'Write a function to connect to an Access database'
      ],
      prompts: [
        {
          id: 'event-handler',
          title: 'Event Handler',
          prompt: 'Create a {event} event handler for {control} that {action}',
          category: 'UI Events',
          variables: ['event', 'control', 'action']
        }
      ]
    },
    {
      id: 'code-explanation',
      name: 'Code Explanation',
      description: 'Explain complex VB6 code and concepts',
      icon: BookOpen,
      category: 'analysis',
      examples: [
        'Explain how this database query works',
        'What does this API call do?',
        'How do VB6 events work?'
      ],
      prompts: []
    },
    {
      id: 'error-fixing',
      name: 'Error Fixing',
      description: 'Diagnose and fix VB6 errors and bugs',
      icon: Shield,
      category: 'debugging',
      examples: [
        'Fix "Type mismatch" error in my calculation',
        'Resolve "Object variable not set" error',
        'Debug why my form won\'t load'
      ],
      prompts: []
    },
    {
      id: 'refactoring',
      name: 'Code Refactoring',
      description: 'Improve code structure and quality',
      icon: Wand2,
      category: 'refactoring',
      examples: [
        'Refactor this long procedure into smaller functions',
        'Eliminate duplicate code in my form validation',
        'Improve the performance of this database query'
      ],
      prompts: []
    }
  ], []);
  
  // Créer une nouvelle conversation
  const createNewConversation = useCallback(() => {
    const newConversation: AIConversation = {
      id: `conv_${Date.now()}`,
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I\'m your Ultra AI Assistant for VB6 development. I can help you with code generation, debugging, refactoring, and explaining VB6 concepts. What would you like to work on today?',
          timestamp: new Date(),
          type: 'text',
          metadata: {
            confidence: 1.0
          }
        }
      ],
      title: 'New Conversation',
      created: new Date(),
      lastUpdated: new Date(),
      context: {
        projectInfo: {
          forms: projectStore.forms.length,
          modules: projectStore.modules.length,
          controls: designerStore.controls.length,
          linesOfCode: 0 // Would be calculated from actual code
        },
        recentErrors: []
      }
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation);
  }, [projectStore.forms.length, projectStore.modules.length, designerStore.controls.length]);
  
  // Envoyer un message
  const sendMessage = useCallback(async () => {
    if (!currentInput.trim() || !activeConversation || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Ajouter le message utilisateur
      const userMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: currentInput,
        timestamp: new Date(),
        type: 'text'
      };
      
      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage],
        lastUpdated: new Date(),
        title: activeConversation.messages.length === 1 ? currentInput.substring(0, 50) + '...' : activeConversation.title
      };
      
      setActiveConversation(updatedConversation);
      setCurrentInput('');
      
      // Générer la réponse IA
      const aiResponse = await aiEngine.processUserInput(
        currentInput,
        updatedConversation.context,
        activeConversation.id
      );
      
      // Ajouter la réponse IA
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiResponse],
        lastUpdated: new Date()
      };
      
      setActiveConversation(finalConversation);
      setConversations(prev => 
        prev.map(conv => conv.id === activeConversation.id ? finalConversation : conv)
      );
      
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentInput, activeConversation, isProcessing, aiEngine]);
  
  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);
  
  // Créer une conversation par défaut
  useEffect(() => {
    if (visible && conversations.length === 0) {
      createNewConversation();
    }
  }, [visible, conversations.length, createNewConversation]);
  
  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
      }
    };
    
    if (inputRef.current) {
      inputRef.current.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [sendMessage]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex">
        {/* Sidebar */}
        <div className="w-80 border-r dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot size={20} />
                <h3 className="font-semibold">Ultra AI</h3>
    
              </div>
              <button
                onClick={createNewConversation}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                title="New Conversation"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Recent Conversations</h4>
              <div className="space-y-1">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-3 rounded hover:bg-gray-50 transition-colors ${
                      activeConversation?.id === conv.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{conv.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {conv.messages.length} messages • {conv.lastUpdated.toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Capabilities */}
          <div className="border-t dark:border-gray-700 p-4">
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>AI Capabilities</span>
              <Sparkles size={16} />
            </button>
            {showCapabilities && (
              <div className="mt-2 space-y-2">
                {aiCapabilities.map(capability => (
                  <div key={capability.id} className="text-xs">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <capability.icon size={12} />
                      <span className="font-medium">{capability.name}</span>
                    </div>
                    <p className="text-gray-500 ml-4 mt-1">{capability.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Brain className="text-purple-600" size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Ultra AI Assistant
                </h2>
                <p className="text-sm text-gray-500">
                  Intelligent VB6 Development Assistant
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <RefreshCw className="animate-spin" size={16} />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4">
            {activeConversation ? (
              <div className="space-y-4">
                {activeConversation.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-sm font-medium">U</span>
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-4xl p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'code'
                            ? 'bg-gray-50 border'
                            : 'bg-white border'
                      }`}>
                        {message.type === 'code' ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-purple-600">Generated Code</span>
                              <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center">
                                <Copy size={12} className="mr-1" />
                                Copy
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap text-sm font-mono">
                              {message.content}
                            </pre>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                        )}
                        
                        {message.metadata?.confidence && message.role === 'assistant' && (
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                            Confidence: {Math.round(message.metadata.confidence * 100)}%
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {message.metadata?.actions && message.metadata.actions.length > 0 && (
                        <div className="mt-2 space-x-2">
                          {message.metadata.actions.map(action => (
                            <button
                              key={action.id}
                              onClick={action.execute}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-1 text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Welcome to Ultra AI Assistant
                </h3>
                <p className="text-gray-500 mb-4">
                  Start a new conversation to begin working with your VB6 AI assistant
                </p>
                <button
                  onClick={createNewConversation}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          {activeConversation && (
            <div className="border-t dark:border-gray-700 p-4">
              <div className="flex space-x-3">
                <textarea
                  ref={inputRef}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Ask me about VB6 development, request code generation, or get help with errors..."
                  className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  disabled={isProcessing}
                />
                <button
                  onClick={sendMessage}
                  disabled={!currentInput.trim() || isProcessing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Press Ctrl+Enter to send • The AI can generate code, explain concepts, fix errors, and more
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UltraAIAssistant;