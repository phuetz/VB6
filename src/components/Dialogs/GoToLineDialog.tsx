/**
 * Go To Line Dialog for VB6 IDE
 * Allows navigation to a specific line number in the code editor
 */

import React, { useState, useEffect, useRef } from 'react';

interface GoToLineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToLine: (lineNumber: number) => void;
  currentLine?: number;
  totalLines?: number;
}

const GoToLineDialog: React.FC<GoToLineDialogProps> = ({
  isOpen,
  onClose,
  onGoToLine,
  currentLine = 1,
  totalLines = 100,
}) => {
  const [lineNumber, setLineNumber] = useState(currentLine.toString());
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLineNumber(currentLine.toString());
      setError('');
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentLine]);

  if (!isOpen) return null;

  const handleGoToLine = () => {
    const num = parseInt(lineNumber, 10);

    if (isNaN(num)) {
      setError('Please enter a valid line number.');
      return;
    }

    if (num < 1) {
      setError('Line number must be greater than 0.');
      return;
    }

    if (num > totalLines) {
      setError(`Line number cannot exceed ${totalLines}.`);
      return;
    }

    onGoToLine(num);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToLine();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLineNumber(value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go To Line"
        className="bg-white border-2 border-gray-400 w-80 flex flex-col shadow-lg"
      >
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-bold">Go To Line</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2 py-1 text-xs">
            ×
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="lineNumber" className="block text-sm font-bold mb-2">
              &Line number:
            </label>
            <input
              ref={inputRef}
              id="lineNumber"
              type="text"
              value={lineNumber}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Enter line number"
            />
            {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
          </div>

          <div className="text-xs text-gray-600">
            Current line: {currentLine} of {totalLines}
          </div>
        </div>

        {/* Dialog Buttons */}
        <div className="border-t border-gray-300 p-3 flex justify-end space-x-2">
          <button
            onClick={handleGoToLine}
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

export default GoToLineDialog;
