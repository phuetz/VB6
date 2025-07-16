/**
 * Control Array Dialog for VB6 IDE
 * Allows creation and management of control arrays
 */

import React, { useState, useEffect } from 'react';
import { Control } from '../../context/types';
import { ControlArrayManager, ControlArrayInfo } from '../../utils/controlArrayManager';

interface ControlArrayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedControl?: Control;
  controls: Control[];
  onCreateArray: (originalControl: Control, newControl: Control) => void;
  onAddToArray: (newControl: Control) => void;
  onRemoveFromArray: (controlId: number) => void;
}

const ControlArrayDialog: React.FC<ControlArrayDialogProps> = ({
  isOpen,
  onClose,
  selectedControl,
  controls,
  onCreateArray,
  onAddToArray,
  onRemoveFromArray,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [newArrayName, setNewArrayName] = useState('');
  const [selectedArrayName, setSelectedArrayName] = useState('');
  const [arrayInfo, setArrayInfo] = useState<ControlArrayInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setArrayInfo(ControlArrayManager.getControlArrays(controls));
      if (selectedControl && !selectedControl.isArray) {
        setNewArrayName(selectedControl.name);
      }
    }
  }, [isOpen, controls, selectedControl]);

  if (!isOpen) return null;

  const handleCreateArray = () => {
    if (!selectedControl || selectedControl.isArray) {
      alert('Please select a single control that is not already part of an array.');
      return;
    }

    try {
      const [originalControl, newControl] = ControlArrayManager.createControlArray(selectedControl);
      onCreateArray(originalControl, newControl);
      onClose();
    } catch (error) {
      alert(`Error creating control array: ${(error as Error).message}`);
    }
  };

  const handleAddToArray = () => {
    if (!selectedArrayName) {
      alert('Please select a control array.');
      return;
    }

    try {
      const newControl = ControlArrayManager.addToControlArray(controls, selectedArrayName);
      onAddToArray(newControl);
    } catch (error) {
      alert(`Error adding to control array: ${(error as Error).message}`);
    }
  };

  const handleRemoveFromArray = (controlId: number) => {
    const controlToRemove = controls.find(c => c.id === controlId);
    if (!controlToRemove) return;

    try {
      onRemoveFromArray(controlId);
    } catch (error) {
      alert(`Error removing from control array: ${(error as Error).message}`);
    }
  };

  const validateArrayName = (name: string): boolean => {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && name.length <= 40;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-gray-400 w-96 max-h-96 flex flex-col">
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-3 py-1 flex items-center justify-between">
          <span className="text-sm font-bold">Control Arrays</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2 py-1 text-xs">
            ×
          </button>
        </div>

        {/* Tab Headers */}
        <div className="border-b border-gray-300 flex">
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === 'create'
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create Array
          </button>
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === 'manage'
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Arrays
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold mb-2">Create Control Array</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Convert a single control into a control array with index 0, and create a second
                  element with index 1.
                </p>
              </div>

              {selectedControl ? (
                <div className="border border-gray-300 p-3 bg-gray-50">
                  <div className="text-xs font-bold mb-1">Selected Control:</div>
                  <div className="text-xs">
                    <div>
                      <strong>Name:</strong> {selectedControl.name}
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedControl.type}
                    </div>
                    <div>
                      <strong>Position:</strong> ({selectedControl.x}, {selectedControl.y})
                    </div>
                  </div>

                  {selectedControl.isArray ? (
                    <div className="text-red-600 text-xs mt-2">
                      This control is already part of an array.
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="block text-xs font-bold mb-1">Array Name:</label>
                      <input
                        type="text"
                        value={newArrayName}
                        onChange={e => setNewArrayName(e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-xs"
                        placeholder="e.g., Command1"
                      />
                      {!validateArrayName(newArrayName) && newArrayName && (
                        <div className="text-red-600 text-xs mt-1">
                          Invalid name. Use letters, numbers, and underscore only.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-xs">
                  No control selected. Please select a control in the designer first.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateArray}
                  disabled={
                    !selectedControl || selectedControl.isArray || !validateArrayName(newArrayName)
                  }
                  className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Array
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold mb-2">Manage Control Arrays</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Add or remove elements from existing control arrays.
                </p>
              </div>

              {arrayInfo.length > 0 ? (
                <div className="space-y-3">
                  {arrayInfo.map(array => (
                    <div key={array.baseName} className="border border-gray-300 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold">{array.baseName}</div>
                        <div className="text-xs text-gray-500">
                          {array.type} • {array.indices.length} elements
                        </div>
                      </div>

                      <div className="text-xs mb-2">
                        <strong>Indices:</strong> {array.indices.join(', ')}
                      </div>

                      <div className="space-y-1 mb-3">
                        {array.controls.map(control => (
                          <div
                            key={control.id}
                            className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1"
                          >
                            <span>{control.name}</span>
                            <button
                              onClick={() => handleRemoveFromArray(control.id)}
                              disabled={array.controls.length <= 1}
                              className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title={
                                array.controls.length <= 1
                                  ? 'Cannot remove the last element'
                                  : 'Remove element'
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedArrayName(array.baseName);
                          handleAddToArray();
                        }}
                        className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700"
                      >
                        Add Element
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs">
                  No control arrays found. Create one using the "Create Array" tab.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlArrayDialog;
