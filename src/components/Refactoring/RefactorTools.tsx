import React, { useState } from 'react';
import { WandSparkles, Pencil, ArrowRightLeft, ArrowBigUp, FileText, FolderPlus, ArrowDown, AlertTriangle } from 'lucide-react';

interface RefactorToolsProps {
  visible: boolean;
  onClose: () => void;
  onApplyRefactoring: (type: string, options: any) => void;
}

export const RefactorTools: React.FC<RefactorToolsProps> = ({
  visible,
  onClose,
  onApplyRefactoring
}) => {
  const [activeRefactoring, setActiveRefactoring] = useState<string | null>(null);
  const [renameOptions, setRenameOptions] = useState({
    oldName: '',
    newName: '',
    scope: 'current'
  });
  const [extractOptions, setExtractOptions] = useState({
    methodName: '',
    selectedCode: '',
    parameters: [] as string[]
  });
  
  const handleApplyRefactoring = () => {
    if (!activeRefactoring) return;
    
    switch (activeRefactoring) {
      case 'rename':
        onApplyRefactoring('rename', renameOptions);
        break;
      case 'extract':
        onApplyRefactoring('extract', extractOptions);
        break;
      default:
        console.warn('Unknown refactoring type:', activeRefactoring);
    }
    
    onClose();
  };
  
  const refactoringOptions = [
    {
      id: 'rename',
      title: 'Rename Symbol',
      description: 'Rename variables, methods, or classes',
      icon: <Pencil size={18} />,
      form: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Current Name</label>
            <input
              type="text"
              value={renameOptions.oldName}
              onChange={(e) => setRenameOptions({...renameOptions, oldName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. intCounter"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">New Name</label>
            <input
              type="text"
              value={renameOptions.newName}
              onChange={(e) => setRenameOptions({...renameOptions, newName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. itemCounter"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Scope</label>
            <select
              value={renameOptions.scope}
              onChange={(e) => setRenameOptions({...renameOptions, scope: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="current">Current File</option>
              <option value="project">Entire Project</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <AlertTriangle size={12} className="inline mr-1" />
            Rename will update all references to this symbol
          </div>
        </div>
      )
    },
    {
      id: 'extract',
      title: 'Extract Method',
      description: 'Create a new method from selected code',
      icon: <ArrowBigUp size={18} />,
      form: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">New Method Name</label>
            <input
              type="text"
              value={extractOptions.methodName}
              onChange={(e) => setExtractOptions({...extractOptions, methodName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. ProcessData"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Selected Code</label>
            <textarea
              value={extractOptions.selectedCode}
              onChange={(e) => setExtractOptions({...extractOptions, selectedCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-24 font-mono"
              placeholder="Code to extract..."
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <AlertTriangle size={12} className="inline mr-1" />
            Parameters will be automatically detected
          </div>
        </div>
      )
    },
    {
      id: 'convert',
      title: 'Convert Code',
      description: 'Convert between patterns and constructs',
      icon: <ArrowRightLeft size={18} />,
    },
    {
      id: 'organize',
      title: 'Organize Imports',
      description: 'Sort and clean up references',
      icon: <ArrowDown size={18} />,
    },
    {
      id: 'move',
      title: 'Move to New File',
      description: 'Move code to a separate module',
      icon: <FileText size={18} />,
    },
    {
      id: 'encapsulate',
      title: 'Encapsulate Field',
      description: 'Create getters and setters for variables',
      icon: <FolderPlus size={18} />,
    }
  ];
  
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '700px', height: '500px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WandSparkles size={16} />
            <span>Refactoring Tools</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          <p className="text-sm text-gray-600 mb-4">
            Select a refactoring operation to improve your code quality and maintainability.
          </p>

          <div className="flex-1 flex gap-4">
            {/* Options */}
            <div className="w-1/3">
              <div className="bg-white border border-gray-400 rounded overflow-hidden">
                {refactoringOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border-b border-gray-200 cursor-pointer ${
                      activeRefactoring === option.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => setActiveRefactoring(option.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${
                        activeRefactoring === option.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{option.title}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="bg-white border border-gray-400 rounded h-full p-4">
                {activeRefactoring ? (
                  <>
                    <h3 className="text-lg font-bold mb-4">
                      {refactoringOptions.find(o => o.id === activeRefactoring)?.title}
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-4">
                        {refactoringOptions.find(o => o.id === activeRefactoring)?.description}
                      </p>
                      
                      {refactoringOptions.find(o => o.id === activeRefactoring)?.form || (
                        <div className="p-4 text-center text-gray-500">
                          This refactoring option is not available yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <WandSparkles size={48} className="mx-auto mb-2 opacity-50" />
                      <div>Select a refactoring option</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-2 border-t border-gray-300 flex justify-end">
            <button
              className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 mr-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleApplyRefactoring}
              disabled={!activeRefactoring}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};