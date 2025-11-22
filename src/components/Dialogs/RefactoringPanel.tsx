import React, { useState, useEffect } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import * as monaco from 'monaco-editor';
import { VB6RefactoringService, RefactoringAction } from '../../services/VB6RefactoringService';
import {
  Code,
  Wand2,
  FileEdit,
  Variable,
  FunctionSquare,
  ArrowRightLeft,
  AlertCircle,
  Package,
  X
} from 'lucide-react';

interface RefactoringPanelProps {
  editor?: monaco.editor.IStandaloneCodeEditor;
  onClose: () => void;
}

const RefactoringPanel: React.FC<RefactoringPanelProps> = ({ editor, onClose }) => {
  const [availableActions, setAvailableActions] = useState<RefactoringAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<RefactoringAction | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewChanges, setPreviewChanges] = useState<string>('');
  
  const refactoringService = new VB6RefactoringService();

  useEffect(() => {
    if (editor) {
      updateAvailableActions();
      
      // Listen for selection changes
      const disposable = editor.onDidChangeCursorSelection(() => {
        updateAvailableActions();
      });
      
      return () => disposable.dispose();
    }
  }, [editor]);

  const updateAvailableActions = () => {
    if (!editor) return;
    
    const model = editor.getModel();
    const selection = editor.getSelection();
    
    if (model && selection) {
      const actions = refactoringService.getRefactoringActions(model, selection);
      setAvailableActions(actions);
    }
  };

  const handleActionSelect = (action: RefactoringAction) => {
    setSelectedAction(action);
    
    if (action.id === 'rename') {
      const model = editor?.getModel();
      const position = editor?.getPosition();
      
      if (model && position) {
        const wordInfo = model.getWordAtPosition(position);
        if (wordInfo) {
          setRenameValue(wordInfo.word);
        }
      }
    }
  };

  const handleApplyRefactoring = async () => {
    if (!editor || !selectedAction) return;
    
    setIsProcessing(true);
    
    try {
      let edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
      
      if (selectedAction.id === 'rename' && renameValue) {
        const model = editor.getModel();
        const position = editor.getPosition();
        
        if (model && position) {
          edits = await refactoringService.renameSymbol(model, position, renameValue);
        }
      } else {
        edits = selectedAction.apply();
      }
      
      if (edits.length > 0) {
        editor.executeEdits('refactoring', edits);
        setSelectedAction(null);
        setRenameValue('');
        updateAvailableActions();
      }
    } catch (error) {
      console.error('Refactoring failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (actionId: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'rename': <FileEdit size={16} />,
      'extractMethod': <FunctionSquare size={16} />,
      'extractVariable': <Variable size={16} />,
      'inlineVariable': <ArrowRightLeft size={16} />,
      'convertToProperty': <Code size={16} />,
      'addErrorHandling': <AlertCircle size={16} />,
      'optimizeImports': <Package size={16} />
    };
    
    return icons[actionId] || <Wand2 size={16} />;
  };

  const renderActionDetails = () => {
    if (!selectedAction) return null;
    
    switch (selectedAction.id) {
      case 'rename':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Rename Symbol</h4>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="New name"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-600">
              All references to this symbol will be renamed
            </p>
          </div>
        );
        
      case 'extractMethod':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Extract Method</h4>
            <p className="text-sm text-gray-600">
              The selected code will be extracted into a new method.
              Parameters will be automatically detected.
            </p>
          </div>
        );
        
      case 'extractVariable':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Extract Variable</h4>
            <p className="text-sm text-gray-600">
              The selected expression will be extracted into a new variable.
              The type will be automatically inferred.
            </p>
          </div>
        );
        
      case 'addErrorHandling':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Add Error Handling</h4>
            <p className="text-sm text-gray-600">
              Error handling code will be added to the current procedure
              with a standard error handler pattern.
            </p>
          </div>
        );
        
      default:
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">{selectedAction.title}</h4>
            <p className="text-sm text-gray-600">{selectedAction.description}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wand2 size={20} />
            Refactoring Tools
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Available Actions */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Available Refactorings</h4>
            {availableActions.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Select code in the editor to see available refactoring options
              </p>
            ) : (
              <div className="space-y-2">
                {availableActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionSelect(action)}
                    className={`w-full p-3 text-left rounded border transition-colors ${
                      selectedAction?.id === action.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getActionIcon(action.id)}
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-gray-600">{action.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Details */}
          {renderActionDetails()}

          {/* Preview (if applicable) */}
          {previewChanges && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Preview Changes</h4>
              <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                {previewChanges}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyRefactoring}
            disabled={!selectedAction || isProcessing || (selectedAction.id === 'rename' && !renameValue)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Apply Refactoring'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefactoringPanel;