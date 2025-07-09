import React, { useState } from 'react';
import { Template, TemplateFile } from '../../types/extended';
import { FolderOpen, FileText, Package, Database, Globe, Puzzle } from 'lucide-react';

interface TemplateWizardProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (template: Template, projectName: string, location: string) => void;
}

const predefinedTemplates: Template[] = [
  {
    id: 'standard-exe',
    name: 'Standard EXE',
    description: 'Creates a standard Windows executable application',
    icon: '🖥️',
    category: 'Application',
    files: [
      {
        path: 'Form1.frm',
        content: `VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Form1"
   ClientHeight    =   3030
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   ScaleHeight     =   3030
   ScaleWidth      =   4680
   StartUpPosition =   3  'Windows Default
End`,
        type: 'form'
      },
      {
        path: 'Project1.vbp',
        content: `Type=Exe
Form=Form1.frm
Reference=*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\System32\\stdole2.tlb#OLE Automation
Object={831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0; MSCOMCTL.OCX
Startup="Form1"
Command32=""
Name="{{projectName}}"
HelpContextID="0"
CompatibleMode="0"
MajorVer=1
MinorVer=0
RevisionVer=0
AutoIncrementVer=0
ServerSupportFiles=0
VersionCompanyName="{{companyName}}"
CompilationType=0
OptimizationType=0
FavorPentiumPro(tm)=0
CodeViewDebugInfo=0
NoAliasing=0
BoundsCheck=0
OverflowCheck=0
FlPointCheck=0
FDIVCheck=0
UnroundedFP=0
StartMode=0
Unattended=0
Retained=0
ThreadPerObject=0
MaxNumberOfThreads=1
ThreadingModel=1`,
        type: 'project'
      }
    ],
    placeholders: {
      projectName: 'Project1',
      companyName: 'Your Company'
    }
  },
  {
    id: 'activex-dll',
    name: 'ActiveX DLL',
    description: 'Creates an ActiveX Dynamic Link Library',
    icon: '📚',
    category: 'Component',
    files: [
      {
        path: 'Class1.cls',
        content: `VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "Class1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = True
Option Explicit

Public Function HelloWorld() As String
    HelloWorld = "Hello from ActiveX DLL!"
End Function`,
        type: 'class'
      },
      {
        path: 'Project1.vbp',
        content: `Type=OleDll
Class=Class1; Class1.cls
Reference=*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\System32\\stdole2.tlb#OLE Automation
Startup="(None)"
Command32=""
Name="{{projectName}}"
HelpContextID="0"
Description="{{description}}"
CompatibleMode="0"
MajorVer=1
MinorVer=0
RevisionVer=0
AutoIncrementVer=0
ServerSupportFiles=0
VersionCompanyName="{{companyName}}"
CompilationType=0
OptimizationType=0
FavorPentiumPro(tm)=0
CodeViewDebugInfo=0
NoAliasing=0
BoundsCheck=0
OverflowCheck=0
FlPointCheck=0
FDIVCheck=0
UnroundedFP=0
StartMode=1
Unattended=0
Retained=0
ThreadPerObject=0
MaxNumberOfThreads=1
ThreadingModel=1`,
        type: 'project'
      }
    ],
    placeholders: {
      projectName: 'Project1',
      description: 'ActiveX DLL Project',
      companyName: 'Your Company'
    }
  },
  {
    id: 'data-project',
    name: 'Data Project',
    description: 'Creates a database-enabled application',
    icon: '🗄️',
    category: 'Database',
    files: [
      {
        path: 'Form1.frm',
        content: `VERSION 5.00
Object = "{CDE57A40-8B86-11D0-B3C6-00A0C90AEA82}#1.0#0"; "MSDATGRD.OCX"
Object = "{F0D2F211-CCB0-11D0-A316-00AA00688B10}#1.0#0"; "MSDATLST.OCX"
Begin VB.Form Form1 
   Caption         =   "Data Entry Form"
   ClientHeight    =   4230
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6390
   LinkTopic       =   "Form1"
   ScaleHeight     =   4230
   ScaleWidth      =   6390
   StartUpPosition =   3  'Windows Default
   Begin MSDataGridLib.DataGrid DataGrid1 
      Height          =   2415
      Left            =   120
      TabIndex        =   0
      Top             =   120
      Width           =   6135
      _ExtentX        =   10821
      _ExtentY        =   4260
      _Version        =   393216
      HeadLines       =   1
      RowHeight       =   15
      BeginProperty HeadFont {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ColumnCount     =   2
      BeginProperty Column00 
         DataField       =   ""
         Caption         =   ""
         BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
            Type            =   0
            Format          =   ""
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   1033
            SubFormatType   =   0
         EndProperty
      EndProperty
      BeginProperty Column01 
         DataField       =   ""
         Caption         =   ""
         BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
            Type            =   0
            Format          =   ""
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   1033
            SubFormatType   =   0
         EndProperty
      EndProperty
   End
End`,
        type: 'form'
      }
    ],
    placeholders: {
      projectName: 'DataProject',
      databaseName: 'Database1'
    }
  }
];

export const TemplateWizard: React.FC<TemplateWizardProps> = ({
  visible,
  onClose,
  onCreateProject
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [step, setStep] = useState(1);
  const [placeholderValues, setPlaceholderValues] = useState<{ [key: string]: string }>({});

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setProjectName(template.placeholders.projectName || '');
    setPlaceholderValues(template.placeholders);
    setStep(2);
  };

  const handleCreate = () => {
    if (!selectedTemplate || !projectName) return;

    const templateWithValues = {
      ...selectedTemplate,
      placeholders: {
        ...selectedTemplate.placeholders,
        projectName,
        ...placeholderValues
      }
    };

    onCreateProject(templateWithValues, projectName, projectLocation);
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setProjectName('');
    setPlaceholderValues({});
  };

  const getTemplateIcon = (template: Template) => {
    const icons: { [key: string]: React.ReactNode } = {
      'standard-exe': <Package size={32} />,
      'activex-dll': <Package size={32} />,
      'data-project': <Database size={32} />,
      'web-app': <Globe size={32} />,
      'add-in': <Puzzle size={32} />
    };
    return icons[template.id] || <FileText size={32} />;
  };

  const groupedTemplates = predefinedTemplates.reduce((groups, template) => {
    const category = template.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {} as { [key: string]: Template[] });

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '700px', height: '500px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>New Project</span>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 px-2"
          >
            ×
          </button>
        </div>

        <div className="p-4 h-full overflow-hidden">
          {step === 1 && (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">Select a project template:</h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">
                      {category}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="bg-white border border-gray-300 p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="text-2xl mb-2">{template.icon}</div>
                            <div className="text-xs font-bold mb-1">{template.name}</div>
                            <div className="text-xs text-gray-600">{template.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedTemplate && (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">Configure your project:</h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Project Name:</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm"
                    placeholder="Enter project name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Location:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                      placeholder="Project location"
                    />
                    <button className="px-3 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400">
                      <FolderOpen size={12} />
                    </button>
                  </div>
                </div>

                {Object.entries(selectedTemplate.placeholders).map(([key, defaultValue]) => {
                  if (key === 'projectName') return null;
                  
                  return (
                    <div key={key} className="mb-4">
                      <label className="block text-xs font-bold mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </label>
                      <input
                        type="text"
                        value={placeholderValues[key] || defaultValue}
                        onChange={(e) => setPlaceholderValues(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="w-full px-2 py-1 border border-gray-400 text-sm"
                        placeholder={`Enter ${key}`}
                      />
                    </div>
                  );
                })}

                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-2">Template Preview:</h4>
                  <div className="bg-gray-100 border border-gray-300 p-3 text-xs">
                    <div className="font-bold mb-1">{selectedTemplate.name}</div>
                    <div className="text-gray-600 mb-2">{selectedTemplate.description}</div>
                    <div className="text-xs">
                      <strong>Files to be created:</strong>
                      <ul className="ml-4 mt-1">
                        {selectedTemplate.files.map((file, index) => (
                          <li key={index} className="text-gray-700">
                            • {file.path}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-300">
                <button
                  onClick={handleBack}
                  className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!projectName.trim()}
                  className="px-4 py-1 bg-blue-500 text-white border border-blue-600 text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};