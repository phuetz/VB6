import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  FileCode,
  Layout,
  Settings,
  Code,
  Eye,
  Copy,
  Download,
  Folder,
  Monitor,
  Database,
  Globe,
  Wrench,
  Shield,
  Palette,
  Target,
  Grid,
  List,
  Menu,
  Toolbar,
  Users,
  Info,
  AlertTriangle,
  Zap,
} from 'lucide-react';

// Types
export enum ProjectType {
  STANDARD_EXE = 'Standard EXE',
  ACTIVEX_EXE = 'ActiveX EXE',
  ACTIVEX_DLL = 'ActiveX DLL',
  ACTIVEX_CONTROL = 'ActiveX Control',
  ACTIVEX_DOCUMENT_EXE = 'ActiveX Document EXE',
  ACTIVEX_DOCUMENT_DLL = 'ActiveX Document DLL',
  DATA_PROJECT = 'Data Project',
  IIS_APPLICATION = 'IIS Application',
  ADDIN = 'Add-In',
}

export enum ApplicationTemplate {
  NONE = 'None - Empty Project',
  SDI = 'Single Document Interface (SDI)',
  MDI = 'Multiple Document Interface (MDI)',
  DIALOG = 'Dialog Based Application',
  DATABASE_FORM = 'Database Form Application',
  DATABASE_EXPLORER = 'Database Explorer',
  WEB_BROWSER = 'Web Browser Application',
  TEXT_EDITOR = 'Text Editor',
  KIOSK = 'Kiosk Application',
  UTILITY = 'System Utility',
  GAME = 'Simple Game Template',
}

export enum InterfaceStyle {
  WINDOWS_95 = 'Windows 95',
  WINDOWS_XP = 'Windows XP',
  OFFICE_97 = 'Office 97',
  OFFICE_2000 = 'Office 2000',
  CUSTOM = 'Custom',
}

export interface ApplicationFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  required: boolean;
  dependsOn?: string[];
  references?: string[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  filename: string;
  controls: Array<{
    type: string;
    name: string;
    properties: Record<string, any>;
  }>;
  code: string;
}

export interface ComponentReference {
  id: string;
  name: string;
  filename: string;
  version: string;
  description: string;
  required: boolean;
  selected: boolean;
  guid?: string;
}

export interface ApplicationConfiguration {
  id: string;
  name: string;
  description: string;
  author: string;
  company: string;
  version: string;
  projectType: ProjectType;
  template: ApplicationTemplate;
  interfaceStyle: InterfaceStyle;
  outputPath: string;
  features: ApplicationFeature[];
  forms: FormTemplate[];
  references: ComponentReference[];
  deploymentOptions: {
    createSetup: boolean;
    includeRuntime: boolean;
    createShortcuts: boolean;
    registerComponents: boolean;
    targetFolder: string;
  };
  codeGeneration: {
    generateComments: boolean;
    useErrorHandling: boolean;
    generateLogging: boolean;
    includeVersionInfo: boolean;
    generateResourceFile: boolean;
  };
}

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  configuration?: ApplicationConfiguration;
  onSave?: (configuration: ApplicationConfiguration) => void;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  isOpen,
  onClose,
  configuration,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<ApplicationConfiguration>(
    () =>
      configuration || {
        id: `app-${Date.now()}`,
        name: 'MyApplication',
        description: 'Application created with VB6 Application Wizard',
        author: 'Developer',
        company: 'My Company',
        version: '1.0.0',
        projectType: ProjectType.STANDARD_EXE,
        template: ApplicationTemplate.SDI,
        interfaceStyle: InterfaceStyle.WINDOWS_XP,
        outputPath: 'C:\\MyProjects\\MyApplication',
        features: [],
        forms: [],
        references: [],
        deploymentOptions: {
          createSetup: true,
          includeRuntime: true,
          createShortcuts: true,
          registerComponents: false,
          targetFolder: 'C:\\Program Files\\MyApplication',
        },
        codeGeneration: {
          generateComments: true,
          useErrorHandling: true,
          generateLogging: false,
          includeVersionInfo: true,
          generateResourceFile: false,
        },
      }
  );

  const totalSteps = 6;

  const availableFeatures: ApplicationFeature[] = [
    {
      id: 'menu-bar',
      name: 'Menu Bar',
      description: 'Standard application menu with File, Edit, View, Help',
      category: 'Interface',
      enabled: true,
      required: false,
    },
    {
      id: 'toolbar',
      name: 'Toolbar',
      description: 'Toolbar with common action buttons',
      category: 'Interface',
      enabled: true,
      required: false,
      dependsOn: ['menu-bar'],
    },
    {
      id: 'status-bar',
      name: 'Status Bar',
      description: 'Status bar at bottom of window',
      category: 'Interface',
      enabled: true,
      required: false,
    },
    {
      id: 'splash-screen',
      name: 'Splash Screen',
      description: 'Startup splash screen with logo',
      category: 'Interface',
      enabled: false,
      required: false,
    },
    {
      id: 'about-dialog',
      name: 'About Dialog',
      description: 'Standard About box with version info',
      category: 'Interface',
      enabled: true,
      required: false,
    },
    {
      id: 'recent-files',
      name: 'Recent Files Menu',
      description: 'Track and display recently opened files',
      category: 'Functionality',
      enabled: false,
      required: false,
      dependsOn: ['menu-bar'],
    },
    {
      id: 'drag-drop',
      name: 'Drag & Drop Support',
      description: 'Enable drag and drop file operations',
      category: 'Functionality',
      enabled: false,
      required: false,
    },
    {
      id: 'database-support',
      name: 'Database Connectivity',
      description: 'ADO database connection and data binding',
      category: 'Data',
      enabled: false,
      required: false,
      references: ['Microsoft ActiveX Data Objects 2.8 Library'],
    },
    {
      id: 'internet-support',
      name: 'Internet Controls',
      description: 'WebBrowser control and Internet functionality',
      category: 'Internet',
      enabled: false,
      required: false,
      references: ['Microsoft Internet Controls'],
    },
    {
      id: 'multimedia',
      name: 'Multimedia Support',
      description: 'Sound and video playback capabilities',
      category: 'Multimedia',
      enabled: false,
      required: false,
      references: ['Windows Media Player'],
    },
    {
      id: 'printing',
      name: 'Print Support',
      description: 'Document printing and print preview',
      category: 'Functionality',
      enabled: false,
      required: false,
    },
    {
      id: 'help-system',
      name: 'Help System',
      description: 'Context-sensitive help and help file integration',
      category: 'Documentation',
      enabled: false,
      required: false,
    },
    {
      id: 'skin-support',
      name: 'Skinnable Interface',
      description: 'Support for custom visual themes and skins',
      category: 'Interface',
      enabled: false,
      required: false,
    },
    {
      id: 'localization',
      name: 'Localization Support',
      description: 'Multi-language resource support',
      category: 'Internationalization',
      enabled: false,
      required: false,
    },
    {
      id: 'registry-settings',
      name: 'Registry Settings',
      description: 'Save/load application settings from registry',
      category: 'Configuration',
      enabled: true,
      required: false,
    },
  ];

  const availableReferences: ComponentReference[] = [
    {
      id: 'vb-runtime',
      name: 'Visual Basic Runtime Objects and Procedures',
      filename: 'VB6.OLB',
      version: '1.0',
      description: 'Core VB6 runtime library',
      required: true,
      selected: true,
    },
    {
      id: 'ado',
      name: 'Microsoft ActiveX Data Objects 2.8 Library',
      filename: 'MSADO15.DLL',
      version: '2.8',
      description: 'Database connectivity through ADO',
      required: false,
      selected: false,
      guid: '{2A75196C-D9EB-4129-B803-931327F72D5C}',
    },
    {
      id: 'dao',
      name: 'Microsoft DAO 3.6 Object Library',
      filename: 'DAO360.DLL',
      version: '3.6',
      description: 'Data Access Objects for Jet databases',
      required: false,
      selected: false,
    },
    {
      id: 'common-controls',
      name: 'Microsoft Windows Common Controls 6.0 (SP6)',
      filename: 'MSCOMCTL.OCX',
      version: '6.0',
      description: 'TreeView, ListView, ImageList, etc.',
      required: false,
      selected: false,
    },
    {
      id: 'internet-controls',
      name: 'Microsoft Internet Controls',
      filename: 'SHDOCVW.DLL',
      version: '1.1',
      description: 'WebBrowser control and Internet functionality',
      required: false,
      selected: false,
    },
    {
      id: 'common-dialogs',
      name: 'Microsoft Common Dialog Control 6.0',
      filename: 'COMDLG32.OCX',
      version: '6.0',
      description: 'File Open, Save, Color, Font, Print dialogs',
      required: false,
      selected: false,
    },
    {
      id: 'rich-textbox',
      name: 'Microsoft Rich Textbox Control 6.0',
      filename: 'RICHTX32.OCX',
      version: '6.0',
      description: 'Rich text editing capabilities',
      required: false,
      selected: false,
    },
    {
      id: 'tabbed-dialog',
      name: 'Microsoft Tabbed Dialog Control 6.0',
      filename: 'TABCTL32.OCX',
      version: '6.0',
      description: 'Tab control for dialog organization',
      required: false,
      selected: false,
    },
    {
      id: 'winsock',
      name: 'Microsoft Winsock Control 6.0',
      filename: 'MSWINSCK.OCX',
      version: '6.0',
      description: 'TCP/UDP network communication',
      required: false,
      selected: false,
    },
    {
      id: 'scripting',
      name: 'Microsoft Scripting Runtime',
      filename: 'SCRRUN.DLL',
      version: '1.0',
      description: 'FileSystemObject and Dictionary',
      required: false,
      selected: false,
    },
  ];

  useEffect(() => {
    // Auto-update features and references based on template
    const updatedFeatures = availableFeatures.map(feature => {
      let enabled = feature.enabled;

      if (
        wizardData.template === ApplicationTemplate.DATABASE_FORM ||
        wizardData.template === ApplicationTemplate.DATABASE_EXPLORER
      ) {
        if (feature.id === 'database-support') enabled = true;
      }

      if (wizardData.template === ApplicationTemplate.WEB_BROWSER) {
        if (feature.id === 'internet-support') enabled = true;
      }

      if (wizardData.template === ApplicationTemplate.MDI) {
        if (feature.id === 'menu-bar' || feature.id === 'toolbar' || feature.id === 'status-bar')
          enabled = true;
      }

      return { ...feature, enabled };
    });

    const updatedReferences = availableReferences.map(ref => {
      let selected = ref.selected;

      // Auto-select references based on enabled features
      updatedFeatures.forEach(feature => {
        if (feature.enabled && feature.references?.includes(ref.name)) {
          selected = true;
        }
      });

      return { ...ref, selected };
    });

    setWizardData({
      ...wizardData,
      features: updatedFeatures,
      references: updatedReferences,
    });
  }, [wizardData.template]);

  const generateProjectFiles = (): Record<string, string> => {
    const files: Record<string, string> = {};

    // Main project file (.vbp)
    let projectFile = `Type=Exe\n`;
    projectFile += `Form=Form1.frm\n`;
    projectFile += `Reference=*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\SysWOW64\\stdole2.tlb#OLE Automation\n`;

    // Add selected references
    wizardData.references
      .filter(ref => ref.selected && !ref.required)
      .forEach(ref => {
        if (ref.guid) {
          projectFile += `Reference=*\\G${ref.guid}#${ref.version}#0#${ref.filename}#${ref.name}\n`;
        } else {
          projectFile += `Object={GUID}#${ref.version}#0; ${ref.filename}\n`;
        }
      });

    projectFile += `Startup="Form1"\n`;
    projectFile += `HelpFile=""\n`;
    projectFile += `Title="${wizardData.name}"\n`;
    projectFile += `ExeName32="${wizardData.name}.exe"\n`;
    projectFile += `Command32=""\n`;
    projectFile += `Name="${wizardData.name}"\n`;
    projectFile += `HelpContextID="0"\n`;
    projectFile += `CompatibleMode="0"\n`;
    projectFile += `MajorVer=${wizardData.version.split('.')[0]}\n`;
    projectFile += `MinorVer=${wizardData.version.split('.')[1]}\n`;
    projectFile += `RevisionVer=${wizardData.version.split('.')[2] || '0'}\n`;
    projectFile += `AutoIncrementVer=0\n`;
    projectFile += `ServerSupportFiles=0\n`;
    projectFile += `VersionCompanyName="${wizardData.company}"\n`;
    projectFile += `VersionFileDescription="${wizardData.description}"\n`;
    projectFile += `VersionLegalCopyright="Copyright © ${new Date().getFullYear()} ${wizardData.company}"\n`;
    projectFile += `VersionProductName="${wizardData.name}"\n`;
    projectFile += `CompilationType=0\n`;
    projectFile += `OptimizationType=0\n`;
    projectFile += `FavorPentiumPro(tm)=0\n`;
    projectFile += `CodeViewDebugInfo=0\n`;
    projectFile += `NoAliasing=0\n`;
    projectFile += `BoundsCheck=0\n`;
    projectFile += `OverflowCheck=0\n`;
    projectFile += `FlPointCheck=0\n`;
    projectFile += `FDIVCheck=0\n`;
    projectFile += `UnroundedFP=0\n`;
    projectFile += `StartMode=0\n`;
    projectFile += `Unattended=0\n`;
    projectFile += `Retained=0\n`;
    projectFile += `ThreadPerObject=0\n`;
    projectFile += `MaxNumberOfThreads=1\n`;

    files[`${wizardData.name}.vbp`] = projectFile;

    // Main form (.frm)
    let mainForm = `VERSION 5.00\n`;

    // Add OCX references for selected components
    wizardData.references
      .filter(ref => ref.selected && ref.filename.endsWith('.OCX'))
      .forEach(ref => {
        const guid = ref.guid || '{SAMPLE-GUID-HERE}';
        mainForm += `Object = "${guid}#${ref.version}#0"; "${ref.filename}"\n`;
      });

    mainForm += `Begin VB.Form Form1\n`;
    mainForm += `   Caption         =   "${wizardData.name}"\n`;
    mainForm += `   ClientHeight    =   6090\n`;
    mainForm += `   ClientLeft      =   120\n`;
    mainForm += `   ClientTop       =   465\n`;
    mainForm += `   ClientWidth     =   8490\n`;
    mainForm += `   LinkTopic       =   "Form1"\n`;
    mainForm += `   ScaleHeight     =   6090\n`;
    mainForm += `   ScaleWidth      =   8490\n`;
    mainForm += `   StartUpPosition =   3  'Windows Default\n`;

    // Add controls based on features
    if (wizardData.features.find(f => f.id === 'menu-bar' && f.enabled)) {
      mainForm += `   Begin VB.Menu mnuFile\n`;
      mainForm += `      Caption         =   "&File"\n`;
      mainForm += `      Begin VB.Menu mnuFileNew\n`;
      mainForm += `         Caption         =   "&New"\n`;
      mainForm += `         Shortcut        =   ^N\n`;
      mainForm += `      End\n`;
      mainForm += `      Begin VB.Menu mnuFileOpen\n`;
      mainForm += `         Caption         =   "&Open..."\n`;
      mainForm += `         Shortcut        =   ^O\n`;
      mainForm += `      End\n`;
      mainForm += `      Begin VB.Menu mnuFileSave\n`;
      mainForm += `         Caption         =   "&Save"\n`;
      mainForm += `         Shortcut        =   ^S\n`;
      mainForm += `      End\n`;
      mainForm += `      Begin VB.Menu mnuFileExit\n`;
      mainForm += `         Caption         =   "E&xit"\n`;
      mainForm += `      End\n`;
      mainForm += `   End\n`;
      mainForm += `   Begin VB.Menu mnuEdit\n`;
      mainForm += `      Caption         =   "&Edit"\n`;
      mainForm += `      Begin VB.Menu mnuEditCut\n`;
      mainForm += `         Caption         =   "Cu&t"\n`;
      mainForm += `         Shortcut        =   ^X\n`;
      mainForm += `      End\n`;
      mainForm += `      Begin VB.Menu mnuEditCopy\n`;
      mainForm += `         Caption         =   "&Copy"\n`;
      mainForm += `         Shortcut        =   ^C\n`;
      mainForm += `      End\n`;
      mainForm += `      Begin VB.Menu mnuEditPaste\n`;
      mainForm += `         Caption         =   "&Paste"\n`;
      mainForm += `         Shortcut        =   ^V\n`;
      mainForm += `      End\n`;
      mainForm += `   End\n`;
      mainForm += `   Begin VB.Menu mnuHelp\n`;
      mainForm += `      Caption         =   "&Help"\n`;
      mainForm += `      Begin VB.Menu mnuHelpAbout\n`;
      mainForm += `         Caption         =   "&About ${wizardData.name}..."\n`;
      mainForm += `      End\n`;
      mainForm += `   End\n`;
    }

    if (wizardData.features.find(f => f.id === 'status-bar' && f.enabled)) {
      mainForm += `   Begin VB.PictureBox picStatusBar\n`;
      mainForm += `      Align           =   2  'Align Bottom\n`;
      mainForm += `      Height          =   375\n`;
      mainForm += `      Left            =   0\n`;
      mainForm += `      ScaleHeight     =   315\n`;
      mainForm += `      ScaleWidth      =   8430\n`;
      mainForm += `      TabIndex        =   0\n`;
      mainForm += `      Top             =   5715\n`;
      mainForm += `      Width           =   8490\n`;
      mainForm += `      Begin VB.Label lblStatus\n`;
      mainForm += `         Caption         =   "Ready"\n`;
      mainForm += `         Height          =   255\n`;
      mainForm += `         Left            =   120\n`;
      mainForm += `         Top             =   60\n`;
      mainForm += `         Width           =   8175\n`;
      mainForm += `      End\n`;
      mainForm += `   End\n`;
    }

    mainForm += `End\n`;
    mainForm += `Attribute VB_Name = "Form1"\n`;
    mainForm += `Attribute VB_GlobalNameSpace = False\n`;
    mainForm += `Attribute VB_Creatable = False\n`;
    mainForm += `Attribute VB_PredeclaredId = True\n`;
    mainForm += `Attribute VB_Exposed = False\n\n`;

    if (wizardData.codeGeneration.generateComments) {
      mainForm += `' ${wizardData.name}\n`;
      mainForm += `' Generated by VB6 Application Wizard\n`;
      mainForm += `' Author: ${wizardData.author}\n`;
      mainForm += `' Company: ${wizardData.company}\n`;
      mainForm += `' Version: ${wizardData.version}\n`;
      mainForm += `' Created: ${new Date().toLocaleDateString()}\n\n`;
    }

    // Form events
    mainForm += `Private Sub Form_Load()\n`;
    if (wizardData.codeGeneration.generateComments) {
      mainForm += `    ' Initialize application\n`;
    }
    if (wizardData.codeGeneration.useErrorHandling) {
      mainForm += `    On Error GoTo ErrorHandler\n    \n`;
    }
    if (wizardData.features.find(f => f.id === 'splash-screen' && f.enabled)) {
      mainForm += `    ' Show splash screen\n`;
      mainForm += `    frmSplash.Show vbModal\n    \n`;
    }
    if (wizardData.features.find(f => f.id === 'registry-settings' && f.enabled)) {
      mainForm += `    ' Load settings from registry\n`;
      mainForm += `    LoadSettings\n    \n`;
    }
    if (wizardData.features.find(f => f.id === 'status-bar' && f.enabled)) {
      mainForm += `    lblStatus.Caption = "Application loaded successfully"\n`;
    }
    if (wizardData.codeGeneration.useErrorHandling) {
      mainForm += `    \n    Exit Sub\n    \nErrorHandler:\n`;
      mainForm += `    MsgBox "Error loading application: " & Err.Description, vbCritical, "${wizardData.name}"\n`;
    }
    mainForm += `End Sub\n\n`;

    // Menu event handlers
    if (wizardData.features.find(f => f.id === 'menu-bar' && f.enabled)) {
      mainForm += `Private Sub mnuFileNew_Click()\n`;
      mainForm += `    ' TODO: Implement New functionality\n`;
      mainForm += `    MsgBox "New functionality not implemented yet", vbInformation\n`;
      mainForm += `End Sub\n\n`;

      mainForm += `Private Sub mnuFileOpen_Click()\n`;
      if (wizardData.references.find(r => r.id === 'common-dialogs' && r.selected)) {
        mainForm += `    ' Show Open dialog\n`;
        mainForm += `    With CommonDialog1\n`;
        mainForm += `        .DialogTitle = "Open File"\n`;
        mainForm += `        .Filter = "All Files (*.*)|*.*"\n`;
        mainForm += `        .ShowOpen\n`;
        mainForm += `        If .FileName <> "" Then\n`;
        mainForm += `            ' TODO: Open selected file\n`;
        mainForm += `        End If\n`;
        mainForm += `    End With\n`;
      } else {
        mainForm += `    ' TODO: Implement Open functionality\n`;
        mainForm += `    MsgBox "Open functionality not implemented yet", vbInformation\n`;
      }
      mainForm += `End Sub\n\n`;

      mainForm += `Private Sub mnuFileExit_Click()\n`;
      mainForm += `    Unload Me\n`;
      mainForm += `End Sub\n\n`;

      if (wizardData.features.find(f => f.id === 'about-dialog' && f.enabled)) {
        mainForm += `Private Sub mnuHelpAbout_Click()\n`;
        mainForm += `    frmAbout.Show vbModal\n`;
        mainForm += `End Sub\n\n`;
      }
    }

    // Helper procedures
    if (wizardData.features.find(f => f.id === 'registry-settings' && f.enabled)) {
      mainForm += `Private Sub LoadSettings()\n`;
      if (wizardData.codeGeneration.generateComments) {
        mainForm += `    ' Load application settings from registry\n`;
      }
      mainForm += `    On Error Resume Next\n`;
      mainForm += `    Me.Left = GetSetting("${wizardData.name}", "Settings", "Left", Me.Left)\n`;
      mainForm += `    Me.Top = GetSetting("${wizardData.name}", "Settings", "Top", Me.Top)\n`;
      mainForm += `    Me.Width = GetSetting("${wizardData.name}", "Settings", "Width", Me.Width)\n`;
      mainForm += `    Me.Height = GetSetting("${wizardData.name}", "Settings", "Height", Me.Height)\n`;
      mainForm += `End Sub\n\n`;

      mainForm += `Private Sub SaveSettings()\n`;
      if (wizardData.codeGeneration.generateComments) {
        mainForm += `    ' Save application settings to registry\n`;
      }
      mainForm += `    SaveSetting "${wizardData.name}", "Settings", "Left", Me.Left\n`;
      mainForm += `    SaveSetting "${wizardData.name}", "Settings", "Top", Me.Top\n`;
      mainForm += `    SaveSetting "${wizardData.name}", "Settings", "Width", Me.Width\n`;
      mainForm += `    SaveSetting "${wizardData.name}", "Settings", "Height", Me.Height\n`;
      mainForm += `End Sub\n\n`;

      mainForm += `Private Sub Form_Unload(Cancel As Integer)\n`;
      mainForm += `    SaveSettings\n`;
      mainForm += `End Sub\n\n`;
    }

    files['Form1.frm'] = mainForm;

    // About form if enabled
    if (wizardData.features.find(f => f.id === 'about-dialog' && f.enabled)) {
      let aboutForm = `VERSION 5.00\n`;
      aboutForm += `Begin VB.Form frmAbout\n`;
      aboutForm += `   BorderStyle     =   3  'Fixed Dialog\n`;
      aboutForm += `   Caption         =   "About ${wizardData.name}"\n`;
      aboutForm += `   ClientHeight    =   3555\n`;
      aboutForm += `   ClientLeft      =   2340\n`;
      aboutForm += `   ClientTop       =   1935\n`;
      aboutForm += `   ClientWidth     =   5730\n`;
      aboutForm += `   MaxButton       =   0   'False\n`;
      aboutForm += `   MinButton       =   0   'False\n`;
      aboutForm += `   ShowInTaskbar   =   0   'False\n`;
      aboutForm += `   StartUpPosition =   1  'CenterOwner\n`;
      aboutForm += `   Begin VB.CommandButton cmdOK\n`;
      aboutForm += `      Caption         =   "OK"\n`;
      aboutForm += `      Default         =   -1  'True\n`;
      aboutForm += `      Height          =   345\n`;
      aboutForm += `      Left            =   4245\n`;
      aboutForm += `      TabIndex        =   0\n`;
      aboutForm += `      Top             =   2625\n`;
      aboutForm += `      Width           =   1260\n`;
      aboutForm += `   End\n`;
      aboutForm += `   Begin VB.Label lblVersion\n`;
      aboutForm += `      Caption         =   "Version ${wizardData.version}"\n`;
      aboutForm += `      Height          =   255\n`;
      aboutForm += `      Left            =   240\n`;
      aboutForm += `      TabIndex        =   3\n`;
      aboutForm += `      Top             =   840\n`;
      aboutForm += `      Width           =   5055\n`;
      aboutForm += `   End\n`;
      aboutForm += `   Begin VB.Label lblDescription\n`;
      aboutForm += `      Caption         =   "${wizardData.description}"\n`;
      aboutForm += `      Height          =   855\n`;
      aboutForm += `      Left            =   240\n`;
      aboutForm += `      TabIndex        =   2\n`;
      aboutForm += `      Top             =   1320\n`;
      aboutForm += `      Width           =   5055\n`;
      aboutForm += `   End\n`;
      aboutForm += `   Begin VB.Label lblProductName\n`;
      aboutForm += `      Caption         =   "${wizardData.name}"\n`;
      aboutForm += `      BeginProperty Font \n`;
      aboutForm += `         Name            =   "MS Sans Serif"\n`;
      aboutForm += `         Size            =   12\n`;
      aboutForm += `         Charset         =   0\n`;
      aboutForm += `         Weight          =   700\n`;
      aboutForm += `         Underline       =   0   'False\n`;
      aboutForm += `         Italic          =   0   'False\n`;
      aboutForm += `         Strikethrough   =   0   'False\n`;
      aboutForm += `      EndProperty\n`;
      aboutForm += `      Height          =   375\n`;
      aboutForm += `      Left            =   240\n`;
      aboutForm += `      TabIndex        =   1\n`;
      aboutForm += `      Top             =   360\n`;
      aboutForm += `      Width           =   5055\n`;
      aboutForm += `   End\n`;
      aboutForm += `End\n`;
      aboutForm += `Attribute VB_Name = "frmAbout"\n\n`;

      aboutForm += `Private Sub cmdOK_Click()\n`;
      aboutForm += `    Unload Me\n`;
      aboutForm += `End Sub\n`;

      files['frmAbout.frm'] = aboutForm;
    }

    return files;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(wizardData);
    }
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Project Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Application Name</label>
          <input
            type="text"
            value={wizardData.name}
            onChange={e => setWizardData({ ...wizardData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Version</label>
          <input
            type="text"
            value={wizardData.version}
            onChange={e => setWizardData({ ...wizardData, version: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={wizardData.description}
          onChange={e => setWizardData({ ...wizardData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Author</label>
          <input
            type="text"
            value={wizardData.author}
            onChange={e => setWizardData({ ...wizardData, author: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <input
            type="text"
            value={wizardData.company}
            onChange={e => setWizardData({ ...wizardData, company: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Path</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={wizardData.outputPath}
            onChange={e => setWizardData({ ...wizardData, outputPath: e.target.value })}
            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center gap-1">
            <Folder className="w-4 h-4" />
            Browse
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Project Type & Template</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Project Type</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(ProjectType).map(type => (
            <div
              key={type}
              className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                wizardData.projectType === type ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setWizardData({ ...wizardData, projectType: type })}
            >
              <div className="flex items-center gap-2">
                {type.includes('EXE') && <Monitor className="w-5 h-5 text-blue-600" />}
                {type.includes('DLL') && <FileCode className="w-5 h-5 text-green-600" />}
                {type.includes('Control') && <Target className="w-5 h-5 text-purple-600" />}
                {type.includes('Data') && <Database className="w-5 h-5 text-orange-600" />}
                {type.includes('IIS') && <Globe className="w-5 h-5 text-red-600" />}
                {type.includes('Add-In') && <Wrench className="w-5 h-5 text-gray-600" />}
                <div>
                  <div className="font-medium text-sm">{type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Application Template</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.values(ApplicationTemplate).map(template => (
            <div
              key={template}
              className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                wizardData.template === template ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setWizardData({ ...wizardData, template })}
            >
              <div className="flex items-center gap-3">
                {template.includes('SDI') && <Layout className="w-5 h-5 text-blue-600" />}
                {template.includes('MDI') && <Grid className="w-5 h-5 text-green-600" />}
                {template.includes('Dialog') && <Monitor className="w-5 h-5 text-purple-600" />}
                {template.includes('Database') && <Database className="w-5 h-5 text-orange-600" />}
                {template.includes('Web') && <Globe className="w-5 h-5 text-red-600" />}
                {template.includes('Text') && <FileCode className="w-5 h-5 text-gray-600" />}
                {template.includes('None') && <FileCode className="w-5 h-5 text-gray-400" />}
                <div>
                  <div className="font-medium">{template}</div>
                  <div className="text-sm text-gray-600">
                    {template === ApplicationTemplate.NONE && 'Start with an empty project'}
                    {template === ApplicationTemplate.SDI && 'Single window application'}
                    {template === ApplicationTemplate.MDI &&
                      'Multiple document interface with child windows'}
                    {template === ApplicationTemplate.DIALOG && 'Simple dialog-based application'}
                    {template === ApplicationTemplate.DATABASE_FORM &&
                      'Form-based database application'}
                    {template === ApplicationTemplate.DATABASE_EXPLORER &&
                      'Database browsing and editing tool'}
                    {template === ApplicationTemplate.WEB_BROWSER &&
                      'Web browser with navigation controls'}
                    {template === ApplicationTemplate.TEXT_EDITOR &&
                      'Basic text editing application'}
                    {template === ApplicationTemplate.KIOSK && 'Full-screen kiosk application'}
                    {template === ApplicationTemplate.UTILITY && 'System utility application'}
                    {template === ApplicationTemplate.GAME && 'Simple game framework'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Interface Style & Features</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Interface Style</label>
        <select
          value={wizardData.interfaceStyle}
          onChange={e =>
            setWizardData({ ...wizardData, interfaceStyle: e.target.value as InterfaceStyle })
          }
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(InterfaceStyle).map(style => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="font-medium mb-3">Application Features</h4>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {[
            'Interface',
            'Functionality',
            'Data',
            'Internet',
            'Multimedia',
            'Documentation',
            'Internationalization',
            'Configuration',
          ].map(category => (
            <div key={category}>
              <h5 className="font-medium text-sm text-gray-700 mt-3 mb-2">{category}</h5>
              {availableFeatures
                .filter(f => f.category === category)
                .map(feature => (
                  <div
                    key={feature.id}
                    className="flex items-start gap-3 p-2 border rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={wizardData.features.find(f => f.id === feature.id)?.enabled || false}
                      onChange={e => {
                        const updatedFeatures = availableFeatures.map(f =>
                          f.id === feature.id ? { ...f, enabled: e.target.checked } : f
                        );
                        setWizardData({ ...wizardData, features: updatedFeatures });
                      }}
                      disabled={feature.required}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{feature.name}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                      {feature.dependsOn && (
                        <div className="text-xs text-orange-600 mt-1">
                          Requires:{' '}
                          {feature.dependsOn
                            .map(dep => availableFeatures.find(f => f.id === dep)?.name || dep)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                    {feature.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Component References</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableReferences.map(ref => (
          <div key={ref.id} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={wizardData.references.find(r => r.id === ref.id)?.selected || false}
              onChange={e => {
                const updatedReferences = availableReferences.map(r =>
                  r.id === ref.id ? { ...r, selected: e.target.checked } : r
                );
                setWizardData({ ...wizardData, references: updatedReferences });
              }}
              disabled={ref.required}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">{ref.name}</div>
              <div className="text-sm text-gray-600">{ref.description}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">
                {ref.filename} • Version {ref.version}
              </div>
              {ref.guid && <div className="text-xs text-gray-400 font-mono">GUID: {ref.guid}</div>}
            </div>
            {ref.required && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Selected References
        </h4>
        <div className="text-sm text-blue-700">
          {wizardData.references.filter(r => r.selected).length} references selected
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Code Generation & Deployment</h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Code Generation Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateComments}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    codeGeneration: {
                      ...wizardData.codeGeneration,
                      generateComments: e.target.checked,
                    },
                  })
                }
              />
              Generate code comments
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.useErrorHandling}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    codeGeneration: {
                      ...wizardData.codeGeneration,
                      useErrorHandling: e.target.checked,
                    },
                  })
                }
              />
              Include error handling
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateLogging}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    codeGeneration: {
                      ...wizardData.codeGeneration,
                      generateLogging: e.target.checked,
                    },
                  })
                }
              />
              Generate logging code
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.includeVersionInfo}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    codeGeneration: {
                      ...wizardData.codeGeneration,
                      includeVersionInfo: e.target.checked,
                    },
                  })
                }
              />
              Include version information
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateResourceFile}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    codeGeneration: {
                      ...wizardData.codeGeneration,
                      generateResourceFile: e.target.checked,
                    },
                  })
                }
              />
              Generate resource file
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Deployment Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.deploymentOptions.createSetup}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    deploymentOptions: {
                      ...wizardData.deploymentOptions,
                      createSetup: e.target.checked,
                    },
                  })
                }
              />
              Create setup package
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.deploymentOptions.includeRuntime}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    deploymentOptions: {
                      ...wizardData.deploymentOptions,
                      includeRuntime: e.target.checked,
                    },
                  })
                }
              />
              Include VB6 runtime files
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.deploymentOptions.createShortcuts}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    deploymentOptions: {
                      ...wizardData.deploymentOptions,
                      createShortcuts: e.target.checked,
                    },
                  })
                }
              />
              Create desktop shortcuts
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.deploymentOptions.registerComponents}
                onChange={e =>
                  setWizardData({
                    ...wizardData,
                    deploymentOptions: {
                      ...wizardData.deploymentOptions,
                      registerComponents: e.target.checked,
                    },
                  })
                }
              />
              Register COM components
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Target Installation Folder</label>
            <input
              type="text"
              value={wizardData.deploymentOptions.targetFolder}
              onChange={e =>
                setWizardData({
                  ...wizardData,
                  deploymentOptions: {
                    ...wizardData.deploymentOptions,
                    targetFolder: e.target.value,
                  },
                })
              }
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => {
    const projectFiles = generateProjectFiles();

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Generated Project Files</h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              const zip = Object.entries(projectFiles)
                .map(([filename, content]) => `// ${filename}\n${content}\n\n`)
                .join('');
              navigator.clipboard.writeText(zip);
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy All Files
          </button>
          <button
            onClick={() => {
              Object.entries(projectFiles).forEach(([filename, content]) => {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              });
            }}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download Project
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(projectFiles).map(([filename, content]) => (
            <div key={filename}>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                {filename}
              </h4>
              <div className="border rounded">
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto h-48">
                  {content}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Project Summary
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>
                Type: <strong>{wizardData.projectType}</strong>
              </div>
              <div>
                Template: <strong>{wizardData.template}</strong>
              </div>
              <div>
                Features: <strong>{wizardData.features.filter(f => f.enabled).length}</strong>
              </div>
              <div>
                References: <strong>{wizardData.references.filter(r => r.selected).length}</strong>
              </div>
              <div>
                Files: <strong>{Object.keys(projectFiles).length}</strong>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Next Steps
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Extract files to project directory</li>
              <li>• Open project in Visual Basic 6</li>
              <li>• Verify component references</li>
              <li>• Customize forms and code</li>
              <li>• Test application functionality</li>
              <li>• Build and deploy application</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] h-[85%] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Application Wizard</h2>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                <div
                  key={step}
                  className={`flex items-center gap-2 ${
                    step === currentStep
                      ? 'text-blue-600'
                      : step < currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === currentStep
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : step < currentStep
                          ? 'bg-green-100 border-2 border-green-600'
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    {step < currentStep ? <Check className="w-3 h-3" /> : step}
                  </div>
                  <span className="font-medium">
                    {step === 1
                      ? 'Project Info'
                      : step === 2
                        ? 'Type & Template'
                        : step === 3
                          ? 'Features'
                          : step === 4
                            ? 'References'
                            : step === 5
                              ? 'Options'
                              : 'Generate'}
                  </span>
                  {step < totalSteps && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {currentStep === totalSteps ? (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Create Application
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
