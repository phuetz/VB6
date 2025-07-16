import React, { useState } from 'react';
import {
  FileType,
  Download,
  X,
  Settings,
  CheckCircle,
  PackageCheck as Package,
  FileCode,
  Monitor,
  FileBox,
} from 'lucide-react';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  options: ExportOption[];
}

interface ExportOption {
  id: string;
  label: string;
  type: 'checkbox' | 'select' | 'text' | 'number';
  defaultValue: any;
  options?: string[];
  description?: string;
}

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  onExport: (format: string, options: Record<string, any>) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ visible, onClose, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('exe');
  const [options, setOptions] = useState<Record<string, any>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportFormats: ExportFormat[] = [
    {
      id: 'exe',
      name: 'Executable (.exe)',
      description: 'Standard Windows executable application',
      icon: <Monitor size={24} className="text-blue-600" />,
      options: [
        {
          id: 'compress',
          label: 'Compress executable',
          type: 'checkbox',
          defaultValue: true,
          description: 'Reduce file size by compressing the executable',
        },
        {
          id: 'optimizationLevel',
          label: 'Optimization Level',
          type: 'select',
          defaultValue: 'medium',
          options: ['none', 'low', 'medium', 'high'],
          description: 'Higher optimization may increase compile time',
        },
        {
          id: 'includeDebugInfo',
          label: 'Include debug information',
          type: 'checkbox',
          defaultValue: false,
          description: 'Include debug symbols for debugging',
        },
        {
          id: 'targetPlatform',
          label: 'Target Platform',
          type: 'select',
          defaultValue: 'x86',
          options: ['x86', 'x64', 'Any CPU'],
          description: 'Processor architecture to target',
        },
      ],
    },
    {
      id: 'dll',
      name: 'ActiveX DLL (.dll)',
      description: 'Dynamic Link Library for component usage',
      icon: <Package size={24} className="text-green-600" />,
      options: [
        {
          id: 'registerForCOM',
          label: 'Register for COM',
          type: 'checkbox',
          defaultValue: true,
          description: 'Register the DLL for COM interop',
        },
        {
          id: 'versionNumber',
          label: 'Version Number',
          type: 'text',
          defaultValue: '1.0.0',
          description: 'Version number in format x.y.z',
        },
        {
          id: 'mtsSafe',
          label: 'MTS Safe',
          type: 'checkbox',
          defaultValue: false,
          description: 'Make the DLL safe for Microsoft Transaction Server',
        },
      ],
    },
    {
      id: 'js',
      name: 'JavaScript (.js)',
      description: 'Web-compatible JavaScript module',
      icon: <FileCode size={24} className="text-yellow-600" />,
      options: [
        {
          id: 'moduleType',
          label: 'Module Type',
          type: 'select',
          defaultValue: 'es6',
          options: ['es6', 'commonjs', 'umd'],
          description: 'JavaScript module format',
        },
        {
          id: 'minify',
          label: 'Minify code',
          type: 'checkbox',
          defaultValue: true,
          description: 'Compress and optimize code size',
        },
        {
          id: 'includeHTML',
          label: 'Generate HTML wrapper',
          type: 'checkbox',
          defaultValue: true,
          description: 'Create HTML file that loads the JavaScript',
        },
      ],
    },
    {
      id: 'source',
      name: 'Source Code (.zip)',
      description: 'Compressed source code package',
      icon: <FileBox size={24} className="text-purple-600" />,
      options: [
        {
          id: 'includeComments',
          label: 'Include comments',
          type: 'checkbox',
          defaultValue: true,
          description: 'Keep comments in the exported code',
        },
        {
          id: 'includeResources',
          label: 'Include resources',
          type: 'checkbox',
          defaultValue: true,
          description: 'Export resource files (images, sounds, etc.)',
        },
        {
          id: 'includeDependencies',
          label: 'Include dependencies',
          type: 'checkbox',
          defaultValue: true,
          description: 'Include referenced libraries and components',
        },
      ],
    },
  ];

  // Initialize options with default values
  React.useEffect(() => {
    const format = exportFormats.find(f => f.id === selectedFormat);
    if (format) {
      const defaultOptions = format.options.reduce(
        (acc, option) => {
          acc[option.id] = option.defaultValue;
          return acc;
        },
        {} as Record<string, any>
      );

      setOptions(defaultOptions);
    }
  }, [selectedFormat]);

  const handleOptionChange = (optionId: string, value: any) => {
    setOptions(prev => ({
      ...prev,
      [optionId]: value,
    }));
  };

  const handleExport = () => {
    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      onExport(selectedFormat, options);

      // Reset success state after a while
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    }, 2000);
  };

  const renderOptionInput = (option: ExportOption) => {
    switch (option.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={options[option.id] || false}
            onChange={e => handleOptionChange(option.id, e.target.checked)}
            className="h-4 w-4"
          />
        );

      case 'select':
        return (
          <select
            value={options[option.id] || option.defaultValue}
            onChange={e => handleOptionChange(option.id, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
          >
            {option.options?.map(opt => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        );

      case 'text':
        return (
          <input
            type="text"
            value={options[option.id] || option.defaultValue}
            onChange={e => handleOptionChange(option.id, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={options[option.id] || option.defaultValue}
            onChange={e => handleOptionChange(option.id, parseFloat(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
          />
        );

      default:
        return null;
    }
  };

  const selectedFormatObj = exportFormats.find(f => f.id === selectedFormat);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '700px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileType size={16} />
            <span>Export Project</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Choose a format and configure options to export your project.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="bg-white border border-gray-300 rounded overflow-hidden">
                {exportFormats.map(format => (
                  <div
                    key={format.id}
                    className={`p-3 border-b border-gray-200 cursor-pointer ${
                      selectedFormat === format.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div>{format.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{format.name}</div>
                        <div className="text-xs text-gray-600 truncate">{format.description}</div>
                      </div>
                      {selectedFormat === format.id && (
                        <CheckCircle size={16} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {selectedFormatObj && (
                <div className="bg-white border border-gray-300 rounded p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings size={16} className="text-gray-600" />
                    <span className="text-sm font-semibold">Export Options</span>
                  </div>

                  <div className="space-y-3">
                    {selectedFormatObj.options.map(option => (
                      <div key={option.id}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium">{option.label}</label>
                          {renderOptionInput(option)}
                        </div>
                        {option.description && (
                          <div className="text-xs text-gray-500">{option.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-300 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-sm rounded mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
                exportSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle size={16} />
                  Exported!
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
