import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';
import { ThemeManager } from '../../services/ThemeManager';

interface OptionsDialogProps {
  visible: boolean;
  onClose: () => void;
}

const OptionsDialog: React.FC<OptionsDialogProps> = ({ visible, onClose }) => {
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const showDialog = useVB6Store((state) => state.showDialog);
  const [selectedTheme, setSelectedTheme] = useState<string>(ThemeManager.getCurrentTheme().name);

  const themes = Object.keys(ThemeManager.defaultThemes);

  const handleClose = () => {
    showDialog('showOptionsDialog', false);
    onClose();
  };

  const handleApply = () => {
    ThemeManager.setThemeByName(selectedTheme);
    handleClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg w-80">
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Options</span>
          <button onClick={handleClose} className="text-white hover:bg-blue-700 px-2">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Theme</label>
            <select
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              className="w-full border border-gray-400 p-1 text-sm"
            >
              {themes.map(name => (
                <option key={name} value={name}>
                  {ThemeManager.defaultThemes[name].name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleClose}
              className="px-2 py-1 bg-gray-300 hover:bg-gray-400 border border-gray-400 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 text-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsDialog;
