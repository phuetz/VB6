import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Palette,
  Code,
  Zap,
  ChevronRight,
  Clock,
  Star,
  Download,
  Upload,
  Settings,
  HelpCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface StartupScreenProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenRecent: (path: string) => void;
  onShowExamples: () => void;
  onShowHelp: () => void;
  onClose: () => void;
}

interface RecentProject {
  name: string;
  path: string;
  lastModified: Date;
  type: 'Standard EXE' | 'ActiveX DLL' | 'ActiveX Control' | 'ActiveX EXE' | 'DHTML Application';
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'Basic' | 'Advanced' | 'Web' | 'Games' | 'Utilities';
  files: string[];
  isPopular?: boolean;
}

const StartupScreen: React.FC<StartupScreenProps> = ({
  onNewProject,
  onOpenProject,
  onOpenRecent,
  onShowExamples,
  onShowHelp,
  onClose,
}) => {
  const [recentProjects] = useState<RecentProject[]>([
    {
      name: 'Calculator',
      path: 'C:\\VB6Projects\\Calculator\\Calculator.vbp',
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'Standard EXE',
    },
    {
      name: 'TextEditor',
      path: 'C:\\VB6Projects\\TextEditor\\TextEditor.vbp',
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      type: 'Standard EXE',
    },
    {
      name: 'DatabaseApp',
      path: 'C:\\VB6Projects\\DatabaseApp\\DatabaseApp.vbp',
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      type: 'Standard EXE',
    },
    {
      name: 'GameEngine',
      path: 'C:\\VB6Projects\\GameEngine\\GameEngine.vbp',
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      type: 'ActiveX DLL',
    },
  ]);

  const [projectTemplates] = useState<ProjectTemplate[]>([
    {
      id: 'standard-exe',
      name: 'Standard EXE',
      description: 'Create a standard Windows executable application',
      icon: <Code className="text-blue-600" size={24} />,
      category: 'Basic',
      files: ['Form1.frm', 'Module1.bas'],
      isPopular: true,
    },
    {
      id: 'activex-dll',
      name: 'ActiveX DLL',
      description: 'Create a reusable component library',
      icon: <Zap className="text-green-600" size={24} />,
      category: 'Advanced',
      files: ['Class1.cls'],
    },
    {
      id: 'activex-control',
      name: 'ActiveX Control',
      description: 'Create a custom control for use in other applications',
      icon: <Palette className="text-purple-600" size={24} />,
      category: 'Advanced',
      files: ['UserControl1.ctl'],
    },
    {
      id: 'data-project',
      name: 'Data Project',
      description: 'Database application with ADO components',
      icon: <FileText className="text-orange-600" size={24} />,
      category: 'Basic',
      files: ['DataForm1.frm', 'DataModule1.bas'],
      isPopular: true,
    },
    {
      id: 'dhtml-app',
      name: 'DHTML Application',
      description: 'Web-based application using DHTML',
      icon: <BookOpen className="text-indigo-600" size={24} />,
      category: 'Web',
      files: ['DHtmlPage1.dsr'],
    },
    {
      id: 'addin',
      name: 'VB6 Add-In',
      description: 'Extend the VB6 IDE with custom functionality',
      icon: <Settings className="text-gray-600" size={24} />,
      category: 'Advanced',
      files: ['Connect.cls', 'frmAddIn.frm'],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showTip, setShowTip] = useState(true);

  const categories = ['All', 'Basic', 'Advanced', 'Web', 'Games', 'Utilities'];

  const filteredTemplates =
    selectedCategory === 'All'
      ? projectTemplates
      : projectTemplates.filter(template => template.category === selectedCategory);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const tips = [
    '💡 Use Ctrl+Space for IntelliSense completion while coding',
    '🎨 Drag controls from the Toolbox to your form to build your UI',
    '🔍 Use the Object Browser (F2) to explore available classes and methods',
    '⚡ Press F5 to run your project instantly',
    '📁 Recent projects are automatically saved in your workspace',
    '🔧 Use the Properties window to customize control behavior',
    '🎯 Set breakpoints by clicking in the margin next to line numbers',
    '📊 The Immediate window lets you test expressions during debugging',
  ];

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full h-5/6 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Code className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Visual Basic 6</h1>
                <p className="text-blue-100 text-sm">Professional Edition</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Quick Start</h3>
            <div className="space-y-2">
              <button
                onClick={onNewProject}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <FileText className="text-blue-600" size={16} />
                </div>
                <div>
                  <div className="font-medium">New Project</div>
                  <div className="text-xs text-gray-500">Create a new VB6 project</div>
                </div>
                <ChevronRight className="text-gray-400 ml-auto" size={16} />
              </button>

              <button
                onClick={onOpenProject}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                  <FolderOpen className="text-green-600" size={16} />
                </div>
                <div>
                  <div className="font-medium">Open Project</div>
                  <div className="text-xs text-gray-500">Open existing .vbp file</div>
                </div>
                <ChevronRight className="text-gray-400 ml-auto" size={16} />
              </button>

              <button
                onClick={onShowExamples}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                  <BookOpen className="text-purple-600" size={16} />
                </div>
                <div>
                  <div className="font-medium">Examples</div>
                  <div className="text-xs text-gray-500">Browse sample projects</div>
                </div>
                <ChevronRight className="text-gray-400 ml-auto" size={16} />
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="p-4 flex-1">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Recent Projects
            </h3>
            <div className="space-y-1">
              {recentProjects.map((project, index) => (
                <button
                  key={index}
                  onClick={() => onOpenRecent(project.path)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm truncate">{project.name}</div>
                  <div className="text-xs text-gray-500 truncate">{project.path}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <span>{formatDate(project.lastModified)}</span>
                    <span>•</span>
                    <span>{project.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tip Section */}
          {showTip && (
            <div className="p-4 border-t bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-start gap-2">
                <Sparkles className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Pro Tip</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{tips[currentTip]}</div>
                </div>
                <button
                  onClick={() => setShowTip(false)}
                  className="text-gray-400 hover:text-gray-600 ml-auto flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
                <p className="text-gray-600 mt-1">Choose a template to get started quickly</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                ×
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mt-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={onNewProject}
                  className="relative border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group bg-white"
                >
                  {template.isPopular && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      Popular
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Includes:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.files.map((file, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onShowHelp}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <HelpCircle size={16} />
                Help & Documentation
              </button>

              <div className="w-px h-4 bg-gray-300" />

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Download size={14} />
                Import Project
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Upload size={14} />
                Export Templates
              </div>
            </div>

            <div className="text-xs text-gray-500">VB6 IDE Clone v2.0 • Ready for Development</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupScreen;
