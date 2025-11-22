import React, { useState, useEffect } from 'react';
import { X, Package, Search, Info, Plus } from 'lucide-react';
import { vb6ActiveXService } from '../../services/VB6ActiveXService';

interface ActiveXManagerProps {
  visible: boolean;
  onClose: () => void;
  onInsertControl?: (progId: string, properties?: any) => void;
}

interface ActiveXInfo {
  progId: string;
  name: string;
  description: string;
  version: string;
  vendor: string;
  category: string;
  icon?: string;
  properties?: { [key: string]: any };
}

const ACTIVEX_CATALOG: ActiveXInfo[] = [
  {
    progId: 'MSComm.MSComm',
    name: 'Microsoft Comm Control 6.0',
    description: 'Serial port communication control for RS-232 and modem communication',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Communication',
    properties: {
      CommPort: 1,
      Settings: '9600,N,8,1',
      RThreshold: 1,
      SThreshold: 1
    }
  },
  {
    progId: 'MSChart20Lib.MSChart',
    name: 'Microsoft Chart Control 6.0',
    description: 'Create 2D and 3D charts including bar, line, pie, and area charts',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Data Visualization',
    properties: {
      ChartType: 1,
      ShowLegend: true,
      Title: 'Chart Title'
    }
  },
  {
    progId: 'SHDocVw.InternetExplorer',
    name: 'Microsoft Web Browser',
    description: 'Embed Internet Explorer browser functionality in your application',
    version: '11.0',
    vendor: 'Microsoft Corporation',
    category: 'Internet',
    properties: {
      LocationURL: 'about:blank',
      AddressBar: true,
      StatusBar: true
    }
  },
  {
    progId: 'MSComDlg.CommonDialog',
    name: 'Microsoft Common Dialog Control 6.0',
    description: 'Standard Windows dialogs for Open, Save, Color, Font, and Print',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Dialogs',
    properties: {
      Filter: 'All Files (*.*)|*.*',
      DialogTitle: ''
    }
  },
  {
    progId: 'MSFlexGridLib.MSFlexGrid',
    name: 'Microsoft FlexGrid Control 6.0',
    description: 'Display and edit tabular data in a spreadsheet-like grid',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Data',
    properties: {
      Rows: 10,
      Cols: 5,
      FixedRows: 1,
      FixedCols: 1
    }
  },
  {
    progId: 'MSHierarchicalFlexGridLib.MSHFlexGrid',
    name: 'Microsoft Hierarchical FlexGrid Control 6.0',
    description: 'Advanced grid control with hierarchical data display capabilities',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Data',
    properties: {
      Rows: 10,
      Cols: 5,
      AllowUserResizing: 3
    }
  },
  {
    progId: 'MediaPlayer.MediaPlayer',
    name: 'Windows Media Player',
    description: 'Play audio and video files in various formats',
    version: '12.0',
    vendor: 'Microsoft Corporation',
    category: 'Multimedia',
    properties: {
      AutoStart: false,
      ShowControls: true,
      ShowStatusBar: true
    }
  },
  {
    progId: 'ShockwaveFlash.ShockwaveFlash',
    name: 'Shockwave Flash Object',
    description: 'Display Adobe Flash content and animations',
    version: '32.0',
    vendor: 'Adobe Systems',
    category: 'Multimedia',
    properties: {
      Playing: false,
      Quality: 'High',
      ScaleMode: 0
    }
  },
  {
    progId: 'ADODB.Connection',
    name: 'ADO Data Control',
    description: 'Connect to databases using ActiveX Data Objects',
    version: '6.1',
    vendor: 'Microsoft Corporation',
    category: 'Data Access',
    properties: {
      ConnectionString: '',
      CommandTimeout: 30,
      CursorLocation: 3
    }
  },
  {
    progId: 'MSDataGridLib.DataGrid',
    name: 'Microsoft DataGrid Control 6.0',
    description: 'Data-bound grid control for displaying database records',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Data',
    properties: {
      AllowAddNew: true,
      AllowDelete: true,
      AllowUpdate: true
    }
  },
  {
    progId: 'MSCAL.Calendar',
    name: 'Microsoft Calendar Control',
    description: 'Display a monthly calendar for date selection',
    version: '11.0',
    vendor: 'Microsoft Corporation',
    category: 'Date/Time',
    properties: {
      ShowDateSelectors: true,
      ShowTitle: true,
      ShowDays: true
    }
  },
  {
    progId: 'RichText.RichTextCtrl',
    name: 'Microsoft Rich Textbox Control 6.0',
    description: 'Advanced text editor with formatting capabilities',
    version: '6.0',
    vendor: 'Microsoft Corporation',
    category: 'Text',
    properties: {
      MultiLine: true,
      ScrollBars: 3,
      AutoVerbMenu: true
    }
  }
];

export const ActiveXManager: React.FC<ActiveXManagerProps> = ({
  visible,
  onClose,
  onInsertControl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedControl, setSelectedControl] = useState<ActiveXInfo | null>(null);
  const [registeredControls, setRegisteredControls] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      // Get list of actually registered controls
      const registered = vb6ActiveXService.listRegisteredControls();
      setRegisteredControls(registered);
    }
  }, [visible]);

  const categories = ['All', ...Array.from(new Set(ACTIVEX_CATALOG.map(c => c.category)))];

  const filteredControls = ACTIVEX_CATALOG.filter(control => {
    const matchesSearch = searchTerm === '' || 
      control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.progId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || control.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleInsert = () => {
    if (selectedControl && onInsertControl) {
      onInsertControl(selectedControl.progId, selectedControl.properties);
      onClose();
    }
  };

  const isControlSupported = (progId: string): boolean => {
    return registeredControls.includes(progId);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="text-purple-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              ActiveX Control Manager
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search ActiveX controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Control List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredControls.map(control => {
                const isSupported = isControlSupported(control.progId);
                return (
                  <div
                    key={control.progId}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedControl?.progId === control.progId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${!isSupported ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedControl(control)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-800">
                          {control.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {control.progId}
                        </p>
                        {!isSupported && (
                          <p className="text-xs text-orange-600 mt-1">
                            (Not yet implemented)
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {control.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Control Details */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedControl ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedControl.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedControl.progId}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">
                    {selectedControl.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Version</h4>
                    <p className="text-sm text-gray-600">{selectedControl.version}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Vendor</h4>
                    <p className="text-sm text-gray-600">{selectedControl.vendor}</p>
                  </div>
                </div>

                {selectedControl.properties && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Default Properties</h4>
                    <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                      {Object.entries(selectedControl.properties).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="text-gray-800">{key}:</span> {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isControlSupported(selectedControl.progId) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="text-orange-500 flex-shrink-0" size={16} />
                      <div className="text-sm text-orange-700">
                        This ActiveX control is not yet implemented in the web environment.
                        Only controls marked as supported can be inserted.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a control to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredControls.length} controls found
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!selectedControl || !isControlSupported(selectedControl.progId)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
              Insert Control
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveXManager;