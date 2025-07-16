/**
 * Tab Order Dialog for VB6 IDE
 * Allows setting the tab order of controls on a form
 */

import React, { useState, useEffect } from 'react';
import { Control } from '../../context/types';

interface TabOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  controls: Control[];
  onUpdateTabOrder: (updatedControls: Control[]) => void;
}

const TabOrderDialog: React.FC<TabOrderDialogProps> = ({
  isOpen,
  onClose,
  controls,
  onUpdateTabOrder,
}) => {
  const [tabStopControls, setTabStopControls] = useState<Control[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      // Filter controls that can receive focus (tabStop = true)
      const focusableControls = controls
        .filter(control => control.tabStop !== false) // Include controls where tabStop is true or undefined
        .sort((a, b) => (a.tabIndex || 0) - (b.tabIndex || 0));

      setTabStopControls(focusableControls);
      setSelectedIndex(-1);
    }
  }, [isOpen, controls]);

  if (!isOpen) return null;

  const handleMoveUp = () => {
    if (selectedIndex <= 0) return;

    const newControls = [...tabStopControls];
    const temp = newControls[selectedIndex - 1];
    newControls[selectedIndex - 1] = newControls[selectedIndex];
    newControls[selectedIndex] = temp;

    setTabStopControls(newControls);
    setSelectedIndex(selectedIndex - 1);
  };

  const handleMoveDown = () => {
    if (selectedIndex < 0 || selectedIndex >= tabStopControls.length - 1) return;

    const newControls = [...tabStopControls];
    const temp = newControls[selectedIndex + 1];
    newControls[selectedIndex + 1] = newControls[selectedIndex];
    newControls[selectedIndex] = temp;

    setTabStopControls(newControls);
    setSelectedIndex(selectedIndex + 1);
  };

  const handleOK = () => {
    // Update tabIndex for all controls based on new order
    const updatedControls = controls.map(control => {
      const index = tabStopControls.findIndex(tc => tc.id === control.id);
      if (index >= 0) {
        return { ...control, tabIndex: index };
      }
      return control;
    });

    onUpdateTabOrder(updatedControls);
    onClose();
  };

  const getControlDisplayName = (control: Control): string => {
    if (control.isArray && control.index !== undefined) {
      return `${control.arrayName}(${control.index})`;
    }
    return control.name;
  };

  const getControlType = (control: Control): string => {
    return control.type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-gray-400 w-96 h-96 flex flex-col shadow-lg">
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-bold">Tab Order</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2 py-1 text-xs">
            ×
          </button>
        </div>

        {/* Instructions */}
        <div className="p-3 border-b border-gray-300 bg-gray-50">
          <p className="text-xs text-gray-700">
            Click a control name to select it, then click Move Up or Move Down to change the tab
            order.
          </p>
        </div>

        {/* Control List */}
        <div className="flex-1 p-3 flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-bold">Tab Order:</span>
          </div>

          <div className="flex-1 border border-gray-300 overflow-y-auto bg-white">
            {tabStopControls.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {tabStopControls.map((control, index) => (
                  <div
                    key={control.id}
                    className={`p-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 ${
                      selectedIndex === index ? 'bg-blue-100 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                        {index}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{getControlDisplayName(control)}</div>
                        <div className="text-xs text-gray-500">{getControlType(control)}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      ({control.x}, {control.y})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No controls with TabStop property found.
              </div>
            )}
          </div>

          {/* Move Buttons */}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleMoveUp}
              disabled={selectedIndex <= 0}
              className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Move &Up
            </button>
            <button
              onClick={handleMoveDown}
              disabled={selectedIndex < 0 || selectedIndex >= tabStopControls.length - 1}
              className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Move &Down
            </button>
          </div>
        </div>

        {/* Dialog Buttons */}
        <div className="border-t border-gray-300 p-3 flex justify-end space-x-2">
          <button
            onClick={handleOK}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            &OK
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabOrderDialog;
